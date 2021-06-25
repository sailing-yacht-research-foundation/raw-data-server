const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveBluewaterData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  try {
    if (data.BluewaterRace) {
      raceUrl = data.BluewaterRace.map((row) => {
        // TODO: Bluewater currently don't have url on race, adding slug temporarily
        return { url: row.slug, original_id: row.original_id };
      });
      await db.bluewaterRace.bulkCreate(data.BluewaterRace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.BluewaterBoat) {
      await db.bluewaterBoat.bulkCreate(data.BluewaterBoat, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.BluewaterBoatHandicap) {
      await db.bluewaterBoatHandicap.bulkCreate(data.BluewaterBoatHandicap, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.BluewaterBoatSocialMedia) {
      await db.bluewaterBoatSocialMedia.bulkCreate(
        data.BluewaterBoatSocialMedia,
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    }
    if (data.BluewaterCrew) {
      await db.bluewaterCrew.bulkCreate(data.BluewaterCrew, {
        ignoreDuplicates: true,
      });
    }
    if (data.BluewaterCrewSocialMedia) {
      await db.bluewaterCrewSocialMedia.bulkCreate(
        data.BluewaterCrewSocialMedia,
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    }
    if (data.BluewaterMap) {
      await db.bluewaterMap.bulkCreate(data.BluewaterMap, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.BluewaterPosition) {
      while (data.BluewaterPosition.length > 0) {
        const splicedArray = data.BluewaterPosition.splice(0, 1000);
        await db.bluewaterPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
        });
      }
    }
    if (data.BluewaterAnnouncement) {
      await db.bluewaterAnnouncement.bulkCreate(data.BluewaterAnnouncement, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
  } catch (error) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (raceUrl.length > 0) {
    if (errorMessage) {
      await db.bluewaterFailedUrl.bulkCreate(
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
      await db.bluewaterSuccessfulUrl.bulkCreate(
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

module.exports = saveBluewaterData;
