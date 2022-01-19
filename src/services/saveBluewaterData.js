const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeBluewater');
const mapAndSave = require('./mappingsToSyrfDB/mapBluewaterToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');

const saveBluewaterData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  let raceMetadata;
  if (process.env.ENABLE_MAIN_DB_SAVE_BLUEWATER !== 'true') {
    try {
      if (data.BluewaterRace) {
        raceUrl = data.BluewaterRace.map((row) => {
          // TODO: Bluewater currently don't have url on race, adding slug temporarily
          return { url: row.slug, original_id: row.original_id };
        });
        await db.bluewaterRace.bulkCreate(data.BluewaterRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.BluewaterBoat) {
        await db.bluewaterBoat.bulkCreate(data.BluewaterBoat, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.BluewaterBoatHandicap) {
        await db.bluewaterBoatHandicap.bulkCreate(data.BluewaterBoatHandicap, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.BluewaterBoatSocialMedia) {
        await db.bluewaterBoatSocialMedia.bulkCreate(
          data.BluewaterBoatSocialMedia,
          {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          },
        );
      }
      if (data.BluewaterCrew) {
        await db.bluewaterCrew.bulkCreate(data.BluewaterCrew, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.BluewaterCrewSocialMedia) {
        await db.bluewaterCrewSocialMedia.bulkCreate(
          data.BluewaterCrewSocialMedia,
          {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          },
        );
      }
      if (data.BluewaterMap) {
        await db.bluewaterMap.bulkCreate(data.BluewaterMap, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.BluewaterPosition) {
        const positions = data.BluewaterPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.bluewaterPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.BluewaterAnnouncement) {
        await db.bluewaterAnnouncement.bulkCreate(data.BluewaterAnnouncement, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }

      if (data.BluewaterRace) {
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
  }

  // temporary add of test env to avoid accidentally saving on maindb until its mocked
  if (
    process.env.ENABLE_MAIN_DB_SAVE_BLUEWATER === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    try {
      if (data.BluewaterRace?.length) {
        raceMetadata = await normalizeRace(data);
        await mapAndSave(data, raceMetadata);
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (raceMetadata) {
    await triggerWeatherSlicer(raceMetadata);
  }
  return errorMessage;
};

module.exports = saveBluewaterData;
