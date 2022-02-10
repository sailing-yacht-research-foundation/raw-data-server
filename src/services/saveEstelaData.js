const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeEstela');
const mapAndSave = require('./mappingsToSyrfDB/mapEstelaToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');

const saveEstelaData = async (data) => {
  let errorMessage = '';
  let raceMetadata;
  if (process.env.ENABLE_MAIN_DB_SAVE_ESTELA !== 'true') {
    let raceUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.EstelaRace) {
        raceUrl = data.EstelaRace.map((row) => {
          return { original_id: row.original_id, url: row.url };
        });
        // Just in case race sent is more than 1, having 3 csv columns might cause max_allowed_packet error
        const races = data.EstelaRace.slice(); // clone array to avoid mutating the data
        while (races.length > 0) {
          const splicedArray = races.splice(0, 20);
          await db.estelaRace.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
          });
        }
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
        const dorsals = data.EstelaDorsal.slice(); // clone array to avoid mutating the data
        while (dorsals.length > 0) {
          const splicedArray = dorsals.splice(0, 50);
          await db.estelaDorsal.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
          });
        }
      }
      if (data.EstelaPlayer) {
        await db.estelaPlayer.bulkCreate(data.EstelaPlayer, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.EstelaPosition) {
        const positions = data.EstelaPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.estelaPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
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

      if (data.EstelaRace) {
        raceMetadata = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      console.log(error);
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
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_ESTELA === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    try {
      if (data.EstelaRace?.length) {
        raceMetadata = await normalizeRace(data);
        await mapAndSave(data, raceMetadata);
      }
    } catch (err) {
      console.log(err);
      errorMessage = databaseErrorHandler(err);
    }
  }

  if (!errorMessage) {
    await triggerWeatherSlicer(raceMetadata);
  }
  return errorMessage;
};

module.exports = saveEstelaData;
