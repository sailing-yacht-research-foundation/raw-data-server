const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveEstelaData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = '';
  try {
    if (data.EstelaRace) {
      raceUrl = data.EstelaRace.url;
      const existRace = await db.estelaRace.findByPk(data.EstelaRace.id);
      if (!existRace) {
        await db.estelaRace.create(data.EstelaRace);
      }
    }
    if (data.EstelaBuoy) {
      await db.estelaBuoy.bulkCreate(data.EstelaBuoy, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.EstelaClub) {
      await db.estelaClub.bulkCreate(data.EstelaClub, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.EstelaDorsal) {
      await db.estelaDorsal.bulkCreate(data.EstelaDorsal, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.EstelaPlayer) {
      await db.estelaPlayer.bulkCreate(data.EstelaPlayer, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.EstelaPosition) {
      await db.estelaPosition.bulkCreate(data.EstelaPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.EstelaResult) {
      await db.estelaResult.bulkCreate(data.EstelaResult, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    transaction.commit();
  } catch (error) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (errorMessage && raceUrl) {
    await db.estelaFailedUrl.create({
      id: uuidv4(),
      url: raceUrl,
      error: errorMessage,
    });
  }

  return errorMessage;
};

module.exports = saveEstelaData;
