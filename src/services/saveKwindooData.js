const { v4: uuidv4 } = require('uuid');

const {
  SAVE_DB_POSITION_CHUNK_COUNT,
  SOURCE,
  UNFINISHED_RACE_PREFIX,
} = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeKwindoo');
const mapAndSave = require('./mappingsToSyrfDB/mapKwindooToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const elasticsearch = require('../utils/elasticsearch');
const { generateMetadataName } = require('../utils/gisUtils');

const saveKwindooData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  let raceMetadatas;

  if (process.env.ENABLE_MAIN_DB_SAVE_KWINDOO !== 'true') {
    try {
      if (data.KwindooRace) {
        raceUrl = data.KwindooRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.kwindooRace.bulkCreate(data.KwindooRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooBoat) {
        await db.kwindooBoat.bulkCreate(data.KwindooBoat, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooRegatta) {
        await db.kwindooRegatta.bulkCreate(data.KwindooRegatta, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooRegattaOwner) {
        await db.kwindooRegattaOwner.bulkCreate(data.KwindooRegattaOwner, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooComment) {
        await db.kwindooComment.bulkCreate(data.KwindooComment, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooHomeportLocation) {
        await db.kwindooHomeportLocation.bulkCreate(
          data.KwindooHomeportLocation,
          {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          },
        );
      }
      if (data.KwindooMarker) {
        await db.kwindooMarker.bulkCreate(data.KwindooMarker, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooMIA) {
        await db.kwindooMIA.bulkCreate(data.KwindooMIA, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooPOI) {
        await db.kwindooPOI.bulkCreate(data.KwindooPOI, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooPosition) {
        const positions = data.KwindooPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.kwindooPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.KwindooRunningGroup) {
        await db.kwindooRunningGroup.bulkCreate(data.KwindooRunningGroup, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooVideoStream) {
        await db.kwindooVideoStream.bulkCreate(data.KwindooVideoStream, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooWaypoint) {
        await db.kwindooWaypoint.bulkCreate(data.KwindooWaypoint, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KwindooRace) {
        raceMetadatas = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (raceUrl.length > 0) {
      if (errorMessage) {
        await db.kwindooFailedUrl.bulkCreate(
          raceUrl.map((row) => {
            return {
              id: uuidv4(),
              url: row.url,
              error: errorMessage,
            };
          }),
          {
            ignoreDuplicates: true,
            validate: true,
          },
        );
      } else {
        await db.kwindooSuccessfulUrl.bulkCreate(
          raceUrl.map((row) => {
            return {
              id: uuidv4(),
              url: row.url,
              original_id: row.original_id,
            };
          }),
          {
            ignoreDuplicates: true,
            validate: true,
          },
        );
      }
    }
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_KWINDOO === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const finishedRaces = [];
    for (const race of data.KwindooRace) {
      const now = Date.now();
      const raceStartTime = new Date(race.start_timestamp * 1000).getTime();
      const raceEndTime = new Date(race.end_timestamp * 1000).getTime();
      const isUnfinished = raceStartTime > now || raceEndTime > now; // also use startTime in case end time is undefined
      const unfinishedRaceId = `${UNFINISHED_RACE_PREFIX}-${SOURCE.KWINDOO}-${race.original_id}`;
      if (isUnfinished) {
        console.log(
          `Future race detected. Will use race id ${unfinishedRaceId}`,
        );
        race.id = unfinishedRaceId;
        try {
          await _indexUnfinishedRaceToES(race, data.KwindooRegatta[0]);
        } catch (err) {
          console.log(
            `Failed indexing unfinished race id ${unfinishedRaceId}`,
            err,
          );
        }
      } else {
        // try to delete race in elastic search if it was scraped in live or future status
        try {
          await elasticsearch.deleteByIds([unfinishedRaceId]);
        } catch (err) {
          if (err.status !== 404 && err.response?.status !== 404) {
            // ignore 404, no record in elastic search
            console.log(
              `Error occured in updating elastic search record ${unfinishedRaceId}`,
              err,
            );
          }
        }
        finishedRaces.push(race);
      }
    }
    data.KwindooRace = finishedRaces;
    if (data.KwindooRace.length > 0) {
      raceMetadatas = await normalizeRace(data);

      try {
        await mapAndSave(data, raceMetadatas);
      } catch (err) {
        console.log(err);
      }
    }
  }

  if (raceMetadatas) {
    for (const raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, regatta) => {
  const startTimeMs = race.start_timestamp * 1000;
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(regatta.name, race.name, startTimeMs);
  const body = {
    id: race.id,
    name,
    event: regatta.id,
    source: SOURCE.KWINDOO,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: race.end_timestamp * 1000,
  };

  await elasticsearch.indexRace(race.id, body);
};

module.exports = saveKwindooData;
