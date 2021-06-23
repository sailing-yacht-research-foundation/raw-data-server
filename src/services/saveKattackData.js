const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveKattackData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.KattackRace) {
      raceUrl = data.KattackRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
      await db.kattackRace.bulkCreate(data.KattackRace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KattackYachtClub) {
      await db.kattackYachtClub.bulkCreate(data.KattackYachtClub, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KattackDevice) {
      await db.kattackDevice.bulkCreate(data.KattackDevice, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KattackPosition) {
      await db.kattackPosition.bulkCreate(data.KattackPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KattackWaypoint) {
      await db.kattackWaypoint.bulkCreate(data.KattackWaypoint, {
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
      await db.kattackFailedUrl.bulkCreate(
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
      await db.kattackSuccessfulUrl.bulkCreate(
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

module.exports = saveKattackData;
