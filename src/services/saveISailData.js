const { v4: uuidv4 } = require('uuid');

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
        await db.iSailEvent.create(data.iSailEvent);
      }
    }
    if (data.iSailClass) {
      await db.iSailClass.bulkCreate(data.iSailClass, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailRace) {
      await db.iSailRace.bulkCreate(data.iSailRace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailEventParticipant) {
      await db.iSailEventParticipant.bulkCreate(data.iSailEventParticipant, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailEventTracksData) {
      const existEventTrack = await db.iSailEventTracksData.findByPk(
        data.iSailEventTracksData.id,
      );
      if (!existEventTrack) {
        await db.iSailEventTracksData.create(data.iSailEventTracksData);
      }
    }
    if (data.iSailTrack) {
      await db.iSailTrack.bulkCreate(data.iSailTrack, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailPosition) {
      await db.iSailPosition.bulkCreate(data.iSailPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailMark) {
      await db.iSailMark.bulkCreate(data.iSailMark, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailStartline) {
      await db.iSailStartline.bulkCreate(data.iSailStartline, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailCourseMark) {
      await db.iSailCourseMark.bulkCreate(data.iSailCourseMark, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailRounding) {
      await db.iSailRounding.bulkCreate(data.iSailRounding, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.iSailResult) {
      await db.iSailResult.bulkCreate(data.iSailResult, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
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
