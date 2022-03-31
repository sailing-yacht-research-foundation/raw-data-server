const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeTackTracker');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapTackTrackerToSyrf = require('../services/mappingsToSyrfDB/mapTackTrackerToSyrf');
const { competitionUnitStatus } = require('../syrf-schema/enums');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  getCountryAndCity,
  createTurfPoint,
  findCenter,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveTackTrackerData = async (data) => {
  let errorMessage = '';
  let raceMetadatas;
  if (process.env.ENABLE_MAIN_DB_SAVE_TACKTRACKER !== 'true') {
    let raceUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.TackTrackerRegatta) {
        const regattaOptions = {
          validate: true,
          transaction,
        };
        if (data.TackTrackerRace) {
          raceUrl = data.TackTrackerRace.map((row) => {
            return { url: row.url, original_id: row.original_id };
          });
          // Put race inside regatta to upsert when regatta original_id already exist
          data.TackTrackerRace.forEach((r) => {
            const regatta = data.TackTrackerRegatta.find(
              (e) => e.original_id === r.regatta_original_id,
            );
            if (!regatta[db.tackTrackerRace.tableName]) {
              regatta[db.tackTrackerRace.tableName] = [];
            }
            regatta[db.tackTrackerRace.tableName].push(r);
          });
          regattaOptions.include = [db.tackTrackerRace];
        }
        const fieldToUpdate = Object.keys(
          db.tackTrackerRegatta.rawAttributes,
        ).filter((k) => !['id', 'original_id'].includes(k));
        regattaOptions.updateOnDuplicate = fieldToUpdate;
        await db.tackTrackerRegatta.bulkCreate(
          data.TackTrackerRegatta,
          regattaOptions,
        );
      } else if (data.TackTrackerRace) {
        // races associated to a user does not have regatta
        raceUrl = data.TackTrackerRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.tackTrackerRace.bulkCreate(data.TackTrackerRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }

      if (data.TackTrackerBoat) {
        await db.tackTrackerBoat.bulkCreate(data.TackTrackerBoat, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TackTrackerDefault) {
        await db.tackTrackerDefault.bulkCreate(data.TackTrackerDefault, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TackTrackerFinish) {
        await db.tackTrackerFinish.bulkCreate(data.TackTrackerFinish, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TackTrackerMark) {
        await db.tackTrackerMark.bulkCreate(data.TackTrackerMark, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TackTrackerPosition) {
        const positions = data.TackTrackerPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.tackTrackerPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.TackTrackerStart) {
        await db.tackTrackerStart.bulkCreate(data.TackTrackerStart, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TackTrackerRace) {
        raceMetadatas = await normalizeRace(data, transaction);
      }
      await transaction.commit();
      console.log('Finished saving TackTracker Races');
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (raceUrl.length > 0) {
      if (errorMessage) {
        await db.tackTrackerFailedUrl.bulkCreate(
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
        await db.tackTrackerSuccessfulUrl.bulkCreate(
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
    process.env.ENABLE_MAIN_DB_SAVE_TACKTRACKER === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const finishedRaces = [];
    for (const race of data.TackTrackerRace) {
      const now = Date.now();
      const raceStartTime = new Date(Date.parse(race.start)).getTime();
      const isUnfinished = raceStartTime >= now || race.state !== 'Complete';
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
    data.TackTrackerRace = finishedRaces;
    if (data.TackTrackerRace.length > 0) {
      try {
        raceMetadatas = await normalizeRace(data);
        await mapTackTrackerToSyrf(data, raceMetadatas?.[0]);
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
  const regatta = data.TackTrackerRegatta?.[0];
  const startLine = data.TackTrackerStart?.find((s) => s.race === race.id);
  const startTimeMs = Date.parse(race.start);
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(regatta?.name, race.name, startTimeMs);
  let startPoint;
  if (startLine) {
    startPoint = findCenter(
      startLine.start_mark_lat,
      startLine.start_mark_lon,
      startLine.start_pin_lat,
      startLine.start_pin_lon,
    );
  } else {
    let startMark = data.TackTrackerMark?.find((m) =>
      m.name?.toLowerCase().includes('start'),
    );
    if (!startMark) {
      startMark = data.TackTrackerMark?.[0];
    }
    if (startMark) {
      startPoint = createTurfPoint(startMark.lat, startMark.lon);
    }
  }

  const body = {
    id: race.id,
    name,
    source: SOURCE.TACKTRACKER,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    open_graph_image: getTrackerLogoUrl(SOURCE.TACKTRACKER), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  if (startTimeMs > Date.now()) {
    body.status = competitionUnitStatus.ONGOING;
  } else {
    body.status = competitionUnitStatus.SCHEDULED;
  }

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

module.exports = saveTackTrackerData;
