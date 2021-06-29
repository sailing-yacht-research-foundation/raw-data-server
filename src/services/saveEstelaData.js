const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveEstelaData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.EstelaRace) {
      raceUrl = data.EstelaRace.map((row) => {
        return { original_id: row.original_id, url: row.url };
      });
      await db.estelaRace.bulkCreate(data.EstelaRace, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.EstelaBuoy) {
      await db.estelaBuoy.bulkCreate(data.EstelaBuoy, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.EstelaClub) {
      await db.estelaClub.bulkCreate(data.EstelaClub, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.EstelaDorsal) {
      await db.estelaDorsal.bulkCreate(data.EstelaDorsal, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.EstelaPlayer) {
      await db.estelaPlayer.bulkCreate(data.EstelaPlayer, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.EstelaPosition) {
      while (data.EstelaPosition.length > 0) {
        const splicedArray = data.EstelaPosition.splice(0, 1000);
        await db.estelaPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
        });
      }
    }
    if (data.EstelaResult) {
      await db.estelaResult.bulkCreate(data.EstelaResult, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    transaction.commit();
  } catch (error) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (raceUrl.length > 0) {
    if (errorMessage) {
      await db.estelaFailedUrl.bulkCreate(
        raceUrl.map((row) => {
          const { url } = row;
          return {
            id: uuidv4(),
            url,
            error: errorMessage,
          };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    } else {
      await db.estelaSuccessfulUrl.bulkCreate(
        raceUrl.map((row) => {
          const { url, original_id } = row;
          return {
            id: uuidv4(),
            url,
            original_id,
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

module.exports = saveEstelaData;
