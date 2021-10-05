const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeISail');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');

const saveISailData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let eventUrl = [];
  let raceMetadatas;
  try {
    if (data.iSailEvent) {
      eventUrl = data.iSailEvent.map((row) => {
        return { original_id: row.original_id, url: row.url };
      });
      await db.iSailEvent.bulkCreate(data.iSailEvent, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
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
      await db.iSailEventTracksData.bulkCreate(data.iSailEventTracksData, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailTrack) {
      await db.iSailTrack.bulkCreate(data.iSailTrack, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.iSailPosition) {
      const positions = data.iSailPosition.slice(); // clone array to avoid mutating the data
      while (positions.length > 0) {
        const splicedArray = positions.splice(
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

    if (data.iSailRace) {
      raceMetadatas = await normalizeRace(data, transaction);
    }
    await transaction.commit();
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (eventUrl.length > 0) {
    if (errorMessage) {
      await db.iSailFailedUrl.bulkCreate(
        eventUrl.map((row) => {
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
      await db.iSailSuccessfulUrl.bulkCreate(
        eventUrl.map((row) => {
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

  if (raceMetadatas) {
    for(raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

module.exports = saveISailData;
