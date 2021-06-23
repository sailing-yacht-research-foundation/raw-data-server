const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveYachtBotData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.YachtBotRace) {
      raceUrl = data.YachtBotRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
      await db.yachtBotRace.bulkCreate(data.YachtBotRace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.YachtBotYacht) {
      await db.yachtBotYacht.bulkCreate(data.YachtBotYacht, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.YachtBotBuoy) {
      await db.yachtBotBuoy.bulkCreate(data.YachtBotBuoy, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.YachtBotPosition) {
      await db.yachtBotPosition.bulkCreate(data.YachtBotPosition, {
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
      await db.yachtBotFailedUrl.bulkCreate(
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
      await db.yachtBotSuccessfulUrl.bulkCreate(
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

module.exports = saveYachtBotData;
