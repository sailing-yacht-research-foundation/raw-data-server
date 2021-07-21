const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeKattack');

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
        transaction,
      });
    }
    if (data.KattackYachtClub) {
      await db.kattackYachtClub.bulkCreate(data.KattackYachtClub, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KattackDevice) {
      await db.kattackDevice.bulkCreate(data.KattackDevice, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KattackPosition) {
      const positions = data.KattackPosition.slice(); // clone array to avoid mutating the data
      while (positions.length > 0) {
        const splicedArray = positions.splice(
          0,
          SAVE_DB_POSITION_CHUNK_COUNT,
        );
        await db.kattackPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }
    if (data.KattackWaypoint) {
      await db.kattackWaypoint.bulkCreate(data.KattackWaypoint, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KattackRace) {
      await normalizeRace(data, transaction);
    }
    await transaction.commit();
  } catch (error) {
    console.log(error);
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
