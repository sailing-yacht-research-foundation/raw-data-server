const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeMetasail');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapMetasailToSyrf = require('./mappingsToSyrfDB/mapMetasailToSyrf');

const saveMetasailData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let eventUrl = [];
  let metasailPositions;
  let raceMetadatas;
  if (process.env.ENABLE_MAIN_DB_SAVE_METASAIL !== 'true') {
    try {
      if (data.MetasailEvent) {
        eventUrl = data.MetasailEvent.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.metasailEvent.bulkCreate(data.MetasailEvent, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailRace) {
        await db.metasailRace.bulkCreate(data.MetasailRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailBoat) {
        await db.metasailBoat.bulkCreate(data.MetasailBoat, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailBuoy) {
        await db.metasailBuoy.bulkCreate(data.MetasailBuoy, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailGate) {
        await db.metasailGate.bulkCreate(data.MetasailGate, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailPosition) {
        metasailPositions = data.MetasailPosition.slice();
        while (metasailPositions.length > 0) {
          const splicedArray = metasailPositions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.metasailPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }

      if (data.MetasailRace) {
        raceMetadatas = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (eventUrl.length > 0) {
      if (errorMessage) {
        await db.metasailFailedUrl.bulkCreate(
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
        await db.metasailSuccessfulUrl.bulkCreate(
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
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_METASAIL === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    try {
      if (data.MetasailRace?.length) {
        raceMetadatas = await normalizeRace(data);
        await mapMetasailToSyrf(data, raceMetadatas);
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (raceMetadatas) {
    for (const raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

module.exports = saveMetasailData;
