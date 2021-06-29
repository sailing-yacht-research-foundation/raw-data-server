const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveKwindooData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.KwindooRace) {
      raceUrl = data.KwindooRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
      await db.kwindooRace.bulkCreate(data.KwindooRace, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooBoat) {
      await db.kwindooBoat.bulkCreate(data.KwindooBoat, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooRegatta) {
      await db.kwindooRegatta.bulkCreate(data.KwindooRegatta, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooRegattaOwner) {
      await db.kwindooRegattaOwner.bulkCreate(data.KwindooRegattaOwner, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooComment) {
      await db.kwindooComment.bulkCreate(data.KwindooComment, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooHomeportLocation) {
      await db.kwindooHomeportLocation.bulkCreate(
        data.KwindooHomeportLocation,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        },
      );
    }
    if (data.KwindooMarker) {
      await db.kwindooMarker.bulkCreate(data.KwindooMarker, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooMIA) {
      await db.kwindooMIA.bulkCreate(data.KwindooMIA, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooPOI) {
      await db.kwindooPOI.bulkCreate(data.KwindooPOI, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooPosition) {
      while (data.KwindooPosition.length > 0) {
        const splicedArray = data.KwindooPosition.splice(0, 1000);
        await db.kwindooPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }
    if (data.KwindooRunningGroup) {
      await db.kwindooRunningGroup.bulkCreate(data.KwindooRunningGroup, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooVideoStream) {
      await db.kwindooVideoStream.bulkCreate(data.KwindooVideoStream, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.KwindooWaypoint) {
      await db.kwindooWaypoint.bulkCreate(data.KwindooWaypoint, {
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

  if (raceUrl.length > 0) {
    if (errorMessage) {
      await db.kwindooFailedUrl.bulkCreate(
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
      await db.kwindooSuccessfulUrl.bulkCreate(
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

module.exports = saveKwindooData;
