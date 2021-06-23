const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveKwindooData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.KwindooBoat) {
      await db.kwindooBoat.bulkCreate(data.KwindooBoat, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooRace) {
      await db.kwindooRace.bulkCreate(data.KwindooRace, {
        ignoreDuplicates: true,
        validate: true,
      });
      raceUrl = data.KwindooRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
    }
    if (data.KwindooRegatta) {
      await db.kwindooRegatta.bulkCreate(data.KwindooRegatta, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooRegattaOwner) {
      await db.kwindooRegattaOwner.bulkCreate(data.KwindooRegattaOwner, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooComment) {
      await db.kwindooComment.bulkCreate(data.KwindooComment, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooHomeportLocation) {
      await db.kwindooHomeportLocation.bulkCreate(
        data.KwindooHomeportLocation,
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    }
    if (data.KwindooMarker) {
      await db.kwindooMarker.bulkCreate(data.KwindooMarker, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooMIA) {
      await db.kwindooMIA.bulkCreate(data.KwindooMIA, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooPOI) {
      await db.kwindooPOI.bulkCreate(data.KwindooPOI, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooPosition) {
      await db.kwindooPosition.bulkCreate(data.KwindooPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooRunningGroup) {
      await db.kwindooRunningGroup.bulkCreate(data.KwindooRunningGroup, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooVideoStream) {
      await db.kwindooVideoStream.bulkCreate(data.KwindooVideoStream, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.KwindooWaypoint) {
      await db.kwindooWaypoint.bulkCreate(data.KwindooWaypoint, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.log(error);
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
