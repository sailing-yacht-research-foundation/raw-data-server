const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeYachtBot');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapYachtbotToSyrf = require('../services/mappingsToSyrfDB/mapYachtbotToSyrf');

const saveYachtBotData = async (data) => {
  let errorMessage = '';
  let raceMetadata;
  if (process.env.ENABLE_MAIN_DB_SAVE_YACHTBOT !== 'true') {
    let raceUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.YachtBotRace) {
        raceUrl = data.YachtBotRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.yachtBotRace.bulkCreate(data.YachtBotRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YachtBotYacht) {
        await db.yachtBotYacht.bulkCreate(data.YachtBotYacht, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YachtBotBuoy) {
        await db.yachtBotBuoy.bulkCreate(data.YachtBotBuoy, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YachtBotMark) {
        await db.yachtBotMark.bulkCreate(data.YachtBotMark, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YachtBotPosition) {
        const positions = data.YachtBotPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.yachtBotPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }

      if (data.YachtBotRace) {
        raceMetadata = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      console.log(error.toString());
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
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_YACHTBOT === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    try {
      if (data.YachtBotRace?.length) {
        raceMetadata = await normalizeRace(data);
        await mapYachtbotToSyrf(data, raceMetadata);
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

module.exports = saveYachtBotData;
