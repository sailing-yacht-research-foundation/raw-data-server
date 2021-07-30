const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeMetasailData');

const saveMetasailData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let eventUrl = [];
  let metasailPositions;
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
      while (data.MetasailPosition.length > 0) {
        const splicedArray = data.MetasailPosition.splice(
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
    data.MetasailPosition = metasailPositions;
    await normalizeRace(data, transaction);
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

  return errorMessage;
};

module.exports = saveMetasailData;
