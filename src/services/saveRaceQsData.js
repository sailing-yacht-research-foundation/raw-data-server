const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeRaceQs');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapRaceQsToSyrf = require('../services/mappingsToSyrfDB/mapRaceQsToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveRaceQsData = async (data) => {
  let errorMessage = '';
  let raceMetadatas;
  if (process.env.ENABLE_MAIN_DB_SAVE_RACEQS !== 'true') {
    let eventUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.RaceQsEvent) {
        eventUrl = data.RaceQsEvent.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.raceQsEvent.bulkCreate(data.RaceQsEvent, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsRegatta) {
        await db.raceQsRegatta.bulkCreate(data.RaceQsRegatta, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsPosition) {
        const positions = data.RaceQsPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.raceQsPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.RaceQsDivision) {
        await db.raceQsDivision.bulkCreate(data.RaceQsDivision, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsParticipant) {
        await db.raceQsParticipant.bulkCreate(data.RaceQsParticipant, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsRoute) {
        const routesWithNoWaypoint = data.RaceQsRoute.filter(
          (r) => !r.waypoint,
        );
        if (routesWithNoWaypoint.length) {
          const waypoints = await db.raceQsWaypoint.findAll({
            attributes: ['id', 'original_id'],
            where: {
              original_id: routesWithNoWaypoint.map((r) =>
                r.waypoint_original_id?.toString(),
              ),
            },
            raw: true,
          });
          routesWithNoWaypoint.forEach((r) => {
            const wpId = waypoints.find(
              (wp) => wp.original_id === r.waypoint_original_id?.toString(),
            )?.id;
            if (wpId) {
              r.waypoint = wpId;
            }
          });
        }
        await db.raceQsRoute.bulkCreate(data.RaceQsRoute, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsStart) {
        await db.raceQsStart.bulkCreate(data.RaceQsStart, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsWaypoint) {
        await db.raceQsWaypoint.bulkCreate(data.RaceQsWaypoint, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.RaceQsEvent) {
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
        await db.raceQsFailedUrl.bulkCreate(
          eventUrl.map((row) => {
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
        await db.raceQsSuccessfulUrl.bulkCreate(
          eventUrl.map((row) => {
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
    process.env.ENABLE_MAIN_DB_SAVE_RACEQS === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const finishedRaces = [];
    for (const race of data.RaceQsEvent) {
      const now = Date.now();
      const startTime = +race.from;
      const endTime = +race.till;
      const isUnfinished = startTime > now || !endTime || endTime > now;
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
    data.RaceQsEvent = finishedRaces;

    if (data.RaceQsEvent.length) {
      try {
        raceMetadatas = await normalizeRace(data);
        await mapRaceQsToSyrf(data, raceMetadatas);
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
  const regatta = data.RaceQsRegatta[0];
  const waypoints = data.RaceQsWaypoint;
  const startTimeMs = +race.from;
  const endTimeMs = +race.till;
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(regatta.name, race.name, startTimeMs);
  const startWaypoint =
    waypoints?.find((wp) => wp.type === 'Start') || waypoints?.[0];
  let startPoint;

  if (startWaypoint && startWaypoint.lat && startWaypoint.lon) {
    startPoint = createTurfPoint(startWaypoint.lat, startWaypoint.lon);
  } else if (race.lat1 && race.lon1) {
    startPoint = createTurfPoint(race.lat1, race.lon1);
  }

  const body = {
    id: race.id,
    name,
    event_name: regatta.name,
    source: SOURCE.RACEQS,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: endTimeMs,
    open_graph_image: getTrackerLogoUrl(SOURCE.RACEQS), // use tracker logo for unfinished races
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

module.exports = saveRaceQsData;
