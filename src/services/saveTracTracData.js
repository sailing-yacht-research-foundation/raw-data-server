const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeTracTrac');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapTracTracToSyrf = require('../services/mappingsToSyrfDB/mapTracTracToSyrf');

const saveTracTracData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  let raceMetadatas;
  try {
    if (data.SailorEmail) {
      await db.sailorEmail.bulkCreate(data.SailorEmail, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracEvent) {
      const eventOptions = {
        validate: true,
        transaction,
      };
      if (data.TracTracRace) {
        raceUrl = data.TracTracRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        // Put race inside event to upsert when event original_id already exist
        data.TracTracRace.forEach((r) => {
          const event = data.TracTracEvent.find((e) => e.original_id === r.event_original_id);
          if (!event[db.tractracRace.tableName]) {
            event[db.tractracRace.tableName] = [];
          }
          event[db.tractracRace.tableName].push(r);
        });
        eventOptions.include = [db.tractracRace];
      }
      const fieldToUpdate = Object.keys(db.tractracEvent.rawAttributes).filter((k) => !['id', 'original_id'].includes(k));
      eventOptions.updateOnDuplicate = fieldToUpdate;
      await db.tractracEvent.bulkCreate(data.TracTracEvent, eventOptions);
    } else if (data.TracTracRace) { // races associated to a club does not have events
      raceUrl = data.TracTracRace.map((row) => {
        return { url: row.url, original_id: row.original_id };
      });
      await db.tractracRace.bulkCreate(data.TracTracRace, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }

    if (data.TracTracClass) {
      await db.tractracClass.bulkCreate(data.TracTracClass, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracRaceClass) {
      await db.tractracRaceClass.bulkCreate(data.TracTracRaceClass, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracCompetitor) {
      await db.tractracCompetitor.bulkCreate(data.TracTracCompetitor, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracCompetitorResult) {
      await db.tractracCompetitorResult.bulkCreate(
        data.TracTracCompetitorResult,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        },
      );
    }
    if (data.TracTracCompetitorPosition) {
      const positions = data.TracTracCompetitorPosition.slice(); // clone array to avoid mutating the data
      while (positions.length > 0) {
        const splicedArray = positions.splice(
          0,
          SAVE_DB_POSITION_CHUNK_COUNT,
        );
        await db.tractracCompetitorPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }
    if (data.TracTracCompetitorPassing) {
      await db.tractracCompetitorPassing.bulkCreate(
        data.TracTracCompetitorPassing,
        {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        },
      );
    }
    if (data.TracTracRoute) {
      await db.tractracRoute.bulkCreate(data.TracTracRoute, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracControl) {
      await db.tractracControl.bulkCreate(data.TracTracControl, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracControlPoint) {
      await db.tractracControlPoint.bulkCreate(data.TracTracControlPoint, {
        ignoreDuplicates: true,
        validate: true,
        transaction,
      });
    }
    if (data.TracTracControlPointPosition) {
      const cpPositions = data.TracTracControlPointPosition.slice(); // clone array to avoid mutating the data
      while (cpPositions.length > 0) {
        const splicedArray = cpPositions.splice(
          0,
          SAVE_DB_POSITION_CHUNK_COUNT,
        );
        await db.tractracControlPointPosition.bulkCreate(splicedArray, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
    }

    if (data.TracTracRace) {
      raceMetadatas = await normalizeRace(data, transaction);
    }
    await transaction.commit();
    console.log('Finished saving TracTrac Races');
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_TRACTRAC === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    await mapTracTracToSyrf(data, raceMetadatas?.[0]);
  }

  if (raceUrl.length > 0) {
    if (errorMessage) {
      await db.tractracFailedUrl.bulkCreate(
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
      await db.tractracSuccessfulUrl.bulkCreate(
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

module.exports = saveTracTracData;
