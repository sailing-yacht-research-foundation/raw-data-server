const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeRaceQs');

const saveRaceQsData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let eventUrl = [];
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
      await normalizeRace(data, transaction);
    }
    await transaction.commit();
  } catch (error) {
    console.log(error.toString());
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

  return errorMessage;
};

module.exports = saveRaceQsData;
