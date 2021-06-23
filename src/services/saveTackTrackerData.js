const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveTackTrackerData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.TackTrackerRace) {
      raceUrl = data.TackTrackerRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
      await db.tackTrackerRace.bulkCreate(data.TackTrackerRace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerRegatta) {
      await db.tackTrackerRegatta.bulkCreate(data.TackTrackerRegatta, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerBoat) {
      await db.tackTrackerBoat.bulkCreate(data.TackTrackerBoat, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerDefault) {
      await db.tackTrackerDefault.bulkCreate(data.TackTrackerDefault, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerFinish) {
      await db.tackTrackerFinish.bulkCreate(data.TackTrackerFinish, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerMark) {
      await db.tackTrackerMark.bulkCreate(data.TackTrackerMark, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerPosition) {
      await db.tackTrackerPosition.bulkCreate(data.TackTrackerPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.TackTrackerStart) {
      await db.tackTrackerStart.bulkCreate(data.TackTrackerStart, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    await transaction.commit();
  } catch (error) {
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

  return errorMessage;
};

module.exports = saveTackTrackerData;
