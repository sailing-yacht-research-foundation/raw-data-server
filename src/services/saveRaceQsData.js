const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeRaceQs');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapRaceQsToSyrf = require('../services/mappingsToSyrfDB/mapRaceQsToSyrf');

const saveRaceQsData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let eventUrl = [];
  let raceMetadatas;
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
      const routesWithNoWaypoint = data.RaceQsRoute.filter((r) => !r.waypoint);
      if (routesWithNoWaypoint.length) {
        const waypoints = await db.raceQsWaypoint.findAll({
          attributes: ['id', 'original_id'],
          where: { original_id: routesWithNoWaypoint.map((r) => r.waypoint_original_id?.toString()) },
          raw: true,
        });
        routesWithNoWaypoint.forEach((r) => {
          const wpId = waypoints.find((wp) => wp.original_id === r.waypoint_original_id?.toString())?.id;
          if (wpId) {
            r.waypoint = wpId;
          }
        })
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

  if (
    process.env.ENABLE_MAIN_DB_SAVE_RACEQS === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    try {
      await mapRaceQsToSyrf(data, raceMetadatas?.[0]);
    } catch (err) {
      console.log('error while mapRaceQsToSyrf');
      console.log(err);
    }
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

  if (raceMetadatas) {
    for(raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

module.exports = saveRaceQsData;
