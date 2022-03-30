const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeISail');
const mapAndSave = require('./mappingsToSyrfDB/mapIsailToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  findCenter,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveISailData = async (data) => {
  let errorMessage = '';
  let raceMetadatas;
  if (process.env.ENABLE_MAIN_DB_SAVE_ISAIL !== 'true') {
    let eventUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.iSailEvent) {
        eventUrl = data.iSailEvent.map((row) => {
          return { original_id: row.original_id, url: row.url };
        });
        await db.iSailEvent.bulkCreate(data.iSailEvent, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailClass) {
        await db.iSailClass.bulkCreate(data.iSailClass, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailRace) {
        await db.iSailRace.bulkCreate(data.iSailRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailEventParticipant) {
        await db.iSailEventParticipant.bulkCreate(data.iSailEventParticipant, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailEventTracksData) {
        await db.iSailEventTracksData.bulkCreate(data.iSailEventTracksData, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailTrack) {
        await db.iSailTrack.bulkCreate(data.iSailTrack, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailPosition) {
        const positions = data.iSailPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.iSailPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.iSailMark) {
        await db.iSailMark.bulkCreate(data.iSailMark, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailStartline) {
        await db.iSailStartline.bulkCreate(data.iSailStartline, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailCourseMark) {
        await db.iSailCourseMark.bulkCreate(data.iSailCourseMark, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailRounding) {
        await db.iSailRounding.bulkCreate(data.iSailRounding, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.iSailResult) {
        await db.iSailResult.bulkCreate(data.iSailResult, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }

      if (data.iSailRace) {
        raceMetadatas = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (eventUrl.length > 0) {
      if (errorMessage) {
        await db.iSailFailedUrl.bulkCreate(
          eventUrl.map((row) => {
            const { url } = row;
            return {
              id: uuidv4(),
              url,
              error: errorMessage,
            };
          }),
          {
            ignoreDuplicates: true,
            validate: true,
          },
        );
      } else {
        await db.iSailSuccessfulUrl.bulkCreate(
          eventUrl.map((row) => {
            const { url, original_id } = row;
            return {
              id: uuidv4(),
              url,
              original_id,
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
    process.env.ENABLE_MAIN_DB_SAVE_ISAIL === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const finishedRaces = [];
    for (const race of data.iSailRace) {
      const now = Date.now();
      const startTime = race.start * 1000;
      const endTime = race.stop * 1000;
      const isUnfinished = startTime > now || endTime > now;
      if (isUnfinished) {
        console.log(
          `Future race detected for race original id ${race.original_id}`,
        );
        try {
          // The deletion of previous elastic search is on a different endpoint and will be triggered by the tracker-scraper
          await _indexUnfinishedRaceToES(race, data);
        } catch (err) {
          console.log(
            `Failed indexing unfinished race original id ${race.original_id}`,
            err,
          );
        }
      } else {
        finishedRaces.push(race);
      }
    }
    data.iSailRace = finishedRaces;

    if (data.iSailRace.length) {
      try {
        raceMetadatas = await normalizeRace(data);
        if (raceMetadatas?.length) {
          await mapAndSave(data, raceMetadatas);
        }
      } catch (err) {
        console.log(err);
        errorMessage = databaseErrorHandler(err);
      }
    }
  }

  if (raceMetadatas && !errorMessage) {
    for (const raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const event = data.iSailEvent[0];
  const startTime = race.start * 1000;
  const endTime = race.stop * 1000;
  const startDate = new Date(startTime);
  const name = generateMetadataName(event.name, race.name, startTime);
  const eventStartLines = data.iSailStartline;
  const raceStartLines = eventStartLines?.filter(
    (s) => s.original_race_id === race.original_id,
  );
  const startLine =
    raceStartLines?.find((sl) => sl.name === 'start') || raceStartLines?.[0];
  let startPoint;
  if (startLine) {
    startPoint = findCenter(
      startLine.lat_1,
      startLine.lon_1,
      startLine.lat_2,
      startLine.lon_2,
    );
  }

  const body = {
    id: race.id,
    name,
    event_name: event.name,
    source: SOURCE.ISAIL,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTime,
    approx_end_time_ms: endTime,
    open_graph_image: getTrackerLogoUrl(SOURCE.ISAIL), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  if (startPoint) {
    body.approx_start_point = startPoint.geometry;
    const { countryName, cityName } = await getCountryAndCity({
      lon: startPoint.geometry.coordinates[0],
      lat: startPoint.geometry.coordinates[1],
    });

    if (countryName) {
      body.start_country = countryName;
    }
    if (cityName) {
      body.start_city = cityName;
    }
  }

  await elasticsearch.indexRace(race.id, body);
};

module.exports = saveISailData;
