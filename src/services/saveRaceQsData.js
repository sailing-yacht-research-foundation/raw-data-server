const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

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
      });
    }
    if (data.RaceQsRegatta) {
      await db.raceQsRegatta.bulkCreate(data.RaceQsRegatta, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.RaceQsPosition) {
      await db.raceQsPosition.bulkCreate(data.RaceQsPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.RaceQsDivision) {
      await db.raceQsDivision.bulkCreate(data.RaceQsDivision, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.RaceQsParticipant) {
      await db.raceQsParticipant.bulkCreate(data.RaceQsParticipant, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.RaceQsRoute) {
      await db.raceQsRoute.bulkCreate(data.RaceQsRoute, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.RaceQsStart) {
      await db.raceQsStart.bulkCreate(data.RaceQsStart, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.RaceQsWaypoint) {
      await db.raceQsWaypoint.bulkCreate(data.RaceQsWaypoint, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    await transaction.commit();
  } catch (error) {
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
