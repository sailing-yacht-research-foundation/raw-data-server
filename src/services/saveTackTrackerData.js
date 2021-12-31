const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeTackTracker');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapTackTrackerToSyrf = require('../services/mappingsToSyrfDB/mapTackTrackerToSyrf');

const saveTackTrackerData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  let raceMetadatas;
  try {
    if (data.TackTrackerRegatta) {
      const regattaOptions = {
        validate: true,
        transaction,
      };
      if (data.TackTrackerRace) {
        raceUrl = data.TackTrackerRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        // Put race inside regatta to upsert when regatta original_id already exist
        data.TackTrackerRace.forEach((r) => {
          const regatta = data.TackTrackerRegatta.find((e) => e.original_id === r.regatta_original_id);
          if (!regatta[db.tackTrackerRace.tableName]) {
            regatta[db.tackTrackerRace.tableName] = [];
          }
          regatta[db.tackTrackerRace.tableName].push(r);
        });
        regattaOptions.include = [db.tackTrackerRace];
      }
      const fieldToUpdate = Object.keys(db.tackTrackerRegatta.rawAttributes).filter((k) => !['id', 'original_id'].includes(k));
      regattaOptions.updateOnDuplicate = fieldToUpdate;
      await db.tackTrackerRegatta.bulkCreate(data.TackTrackerRegatta, regattaOptions);
    } else if (data.TackTrackerRace) { // races associated to a user does not have regatta
      raceUrl = data.TackTrackerRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
      await db.tackTrackerRace.bulkCreate(data.TackTrackerRace, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }

    if (data.TackTrackerBoat) {
      await db.tackTrackerBoat.bulkCreate(data.TackTrackerBoat, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TackTrackerDefault) {
      await db.tackTrackerDefault.bulkCreate(data.TackTrackerDefault, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TackTrackerFinish) {
      await db.tackTrackerFinish.bulkCreate(data.TackTrackerFinish, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TackTrackerMark) {
      await db.tackTrackerMark.bulkCreate(data.TackTrackerMark, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TackTrackerPosition) {
      const positions = data.TackTrackerPosition.slice(); // clone array to avoid mutating the data
      while (positions.length > 0) {
        const splicedArray = positions.splice(
          0,
          SAVE_DB_POSITION_CHUNK_COUNT,
        );
        await db.tackTrackerPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }
    if (data.TackTrackerStart) {
      await db.tackTrackerStart.bulkCreate(data.TackTrackerStart, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TackTrackerRace) {
      raceMetadatas = await normalizeRace(data, transaction);
    }
    await transaction.commit();
    console.log('Finished saving TackTracker Races');
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_TACKTRACKER === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    await mapTackTrackerToSyrf(data, raceMetadatas?.[0]);
  }

  if (raceUrl.length > 0) {
    if (errorMessage) {
      await db.tackTrackerFailedUrl.bulkCreate(
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
      await db.tackTrackerSuccessfulUrl.bulkCreate(
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

  if (raceMetadatas) {
    for (raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

module.exports = saveTackTrackerData;
