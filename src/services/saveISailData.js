const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveISailData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let eventUrl = '';
  let originalId = null;
  try {
    if (data.iSailEvent) {
      // This field contains only a single object
      const existEvent = await db.iSailEvent.findByPk(data.iSailEvent.id);
      if (!existEvent) {
        eventUrl = data.iSailEvent.url;
        originalId = data.iSailEvent.original_id;
        await db.iSailEvent.create(data.iSailEvent, { transaction });
      }
    }
    if (data.iSailClass) {
      await db.iSailClass.bulkCreate(data.iSailClass, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailRace) {
      await db.iSailRace.bulkCreate(data.iSailRace, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailEventParticipant) {
      await db.iSailEventParticipant.bulkCreate(data.iSailEventParticipant, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailEventTracksData) {
      const existEventTrack = await db.iSailEventTracksData.findByPk(
        data.iSailEventTracksData.id,
      );
      if (!existEventTrack) {
        await db.iSailEventTracksData.create(data.iSailEventTracksData, {
          transaction,
        });
      }
    }
    if (data.iSailTrack) {
      await db.iSailTrack.bulkCreate(data.iSailTrack, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailPosition) {
      while (data.iSailPosition.length > 0) {
        const splicedArray = data.iSailPosition.splice(
          0,
          SAVE_DB_POSITION_CHUNK_COUNT,
        );
        await db.iSailPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }
    if (data.iSailMark) {
      await db.iSailMark.bulkCreate(data.iSailMark, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailStartline) {
      await db.iSailStartline.bulkCreate(data.iSailStartline, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailCourseMark) {
      await db.iSailCourseMark.bulkCreate(data.iSailCourseMark, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailRounding) {
      await db.iSailRounding.bulkCreate(data.iSailRounding, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailResult) {
      await db.iSailResult.bulkCreate(data.iSailResult, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (eventUrl) {
    if (errorMessage) {
      await db.iSailFailedUrl.create({
        id: uuidv4(),
        url: eventUrl,
        error: errorMessage,
      });
    } else {
      await db.iSailSuccessfulUrl.create({
        id: uuidv4(),
        url: eventUrl,
        original_id: originalId,
      });
    }
  }

  return errorMessage;
};

module.exports = saveISailData;
