const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeTracTrac');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapTracTracToSyrf = require('../services/mappingsToSyrfDB/mapTracTracToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveTracTracData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  let raceMetadatas;
  if (process.env.ENABLE_MAIN_DB_SAVE_TRACTRAC !== 'true') {
    try {
      if (data.SailorEmail) {
        await db.sailorEmail.bulkCreate(data.SailorEmail, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracEvent) {
        const eventOptions = {
          validate: true,
          transaction,
        };
        if (data.TracTracRace) {
          raceUrl = data.TracTracRace.map((row) => {
            return { url: row.url, original_id: row.original_id };
          });
          // Put race inside event to upsert when event original_id already exist
          data.TracTracRace.forEach((r) => {
            const event = data.TracTracEvent.find(
              (e) => e.original_id === r.event_original_id,
            );
            if (!event[db.tractracRace.tableName]) {
              event[db.tractracRace.tableName] = [];
            }
            event[db.tractracRace.tableName].push(r);
          });
          eventOptions.include = [db.tractracRace];
        }
        const fieldToUpdate = Object.keys(
          db.tractracEvent.rawAttributes,
        ).filter((k) => !['id', 'original_id'].includes(k));
        eventOptions.updateOnDuplicate = fieldToUpdate;
        await db.tractracEvent.bulkCreate(data.TracTracEvent, eventOptions);
      } else if (data.TracTracRace) {
        // races associated to a club does not have events
        raceUrl = data.TracTracRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.tractracRace.bulkCreate(data.TracTracRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }

      if (data.TracTracClass) {
        await db.tractracClass.bulkCreate(data.TracTracClass, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracRaceClass) {
        await db.tractracRaceClass.bulkCreate(data.TracTracRaceClass, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracCompetitor) {
        await db.tractracCompetitor.bulkCreate(data.TracTracCompetitor, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracCompetitorResult) {
        await db.tractracCompetitorResult.bulkCreate(
          data.TracTracCompetitorResult,
          {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          },
        );
      }
      if (data.TracTracCompetitorPosition) {
        const positions = data.TracTracCompetitorPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.tractracCompetitorPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.TracTracCompetitorPassing) {
        await db.tractracCompetitorPassing.bulkCreate(
          data.TracTracCompetitorPassing,
          {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          },
        );
      }
      if (data.TracTracRoute) {
        await db.tractracRoute.bulkCreate(data.TracTracRoute, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracControl) {
        await db.tractracControl.bulkCreate(data.TracTracControl, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracControlPoint) {
        await db.tractracControlPoint.bulkCreate(data.TracTracControlPoint, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.TracTracControlPointPosition) {
        const cpPositions = data.TracTracControlPointPosition.slice(); // clone array to avoid mutating the data
        while (cpPositions.length > 0) {
          const splicedArray = cpPositions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.tractracControlPointPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }

      if (data.TracTracRace) {
        raceMetadatas = await normalizeRace(data, transaction);
      }
      await transaction.commit();
      console.log('Finished saving TracTrac Races');
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (raceUrl.length > 0) {
      if (errorMessage) {
        await db.tractracFailedUrl.bulkCreate(
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
        await db.tractracSuccessfulUrl.bulkCreate(
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
    process.env.ENABLE_MAIN_DB_SAVE_TRACTRAC === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const finishedRaces = [];
    for (const race of data.TracTracRace) {
      const now = Date.now();
      const raceStartTime = new Date(race.tracking_start).getTime();
      const raceEndTime = new Date(race.tracking_stop).getTime();
      const isUnfinished = raceStartTime > now || raceEndTime > now; // also use startTime in case end time is undefined
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
    data.TracTracRace = finishedRaces;

    if (data.TracTracRace?.length > 0) {
      raceMetadatas = await normalizeRace(data);

      try {
        await mapTracTracToSyrf(data, raceMetadatas?.[0]);
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

const _indexUnfinishedRaceToES = async (race, data) => {
  const event = data.TracTracEvent?.[0];
  const startDate = new Date(race.tracking_start);
  const startTimeMs = startDate.getTime();
  const name = generateMetadataName(event?.name, race.name, startTimeMs);
  let startPoint;
  if (event?.lat && event?.lon) {
    // only event races has lat lon on events
    startPoint = createTurfPoint(event?.lat, event?.lon);
  }

  if (!startPoint && race.lat && race.lon) {
    startPoint = createTurfPoint(race.lat, race.lon);
  }

  const body = {
    id: race.id,
    name,
    event: event?.id,
    source: SOURCE.TRACTRAC,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: new Date(race.tracking_stop).getTime(),
    open_graph_image: getTrackerLogoUrl(SOURCE.TRACTRAC), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  if (startPoint) {
    // there is a country and city in tractrac events/race but it is abbreviated so to make it standard use our own from given positions
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

module.exports = saveTracTracData;
