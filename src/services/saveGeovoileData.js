const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');

const saveSuccessfulUrl = async (original_id, url) => {
  await db.geovoileSuccessfulUrl.create({ url, original_id, id: uuidv4() });
};

const saveFailedUrl = async (url, error) => {
  await db.geovoileFailedUrl.create(
    { url, error, id: uuidv4() },
    {
      ignoreDuplicates: true,
      validate: true,
    },
  );
};

const saveGeovoileRace = async (raceData, transaction) => {
  const id = uuidv4();
  const race = { ...raceData, id };
  await db.geovoileRace.create(race, { transaction });
  return race;
};

const saveGeovoileBoats = async (boats, transaction) => {
  await db.geovoileBoat.bulkCreate(boats, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });

  return boats;
};

const saveGeovoileSailors = async (sailors, transaction) => {
  await db.geovoileBoatSailor.bulkCreate(sailors, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });

  return sailors;
};

const saveGeovoileBoatPositions = async (processedPositions, transaction) => {
  const positions = processedPositions.slice(); // clone array to avoid mutating the data
  while (positions.length > 0) {
    const splicedArray = positions.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
    await db.geovoileBoatPosition.bulkCreate(splicedArray, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });
  }
};

const saveGeovoileData = async (data) => {
  if (!data.geovoileRace) {
    console.log(`Race is not found`);
    return;
  }
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';

  try {
    const race = await saveGeovoileRace(data.geovoileRace, transaction);

    const sailors = [];
    const positions = [];
    const boats = data.boats.map((t) => {
      const boatId = uuidv4();
      const currentSailors = (t.sailors || []).map((sailor) => {
        return {
          ...sailor,
          race_id: race.id,
          race_original_id: race.original_id,
          boat_id: boatId,
          boat_original_id: t.original_id,
          id: uuidv4(),
        };
      });
      sailors.push(...currentSailors);
      const currentBoatPositions = (t.track?.locations || []).map(
        (location) => {
          {
            return {
              ...location,
              race_id: race.id,
              race_original_id: race.original_id,
              boat_id: boatId,
              boat_original_id: t.original_id,
              id: uuidv4(),
            };
          }
        },
      );

      positions.push(...currentBoatPositions);
      return {
        id: boatId,
        original_id: t.original_id,
        race_id: race.id,
        race_original_id: race.original_id,
        name: t.name,
        short_name: t.short_name,
        hulls: t.hulls,
        hullColor: t.hullColor,
      };
    });

    await saveGeovoileBoats(boats, transaction);
    await saveGeovoileSailors(sailors, transaction);

    await saveGeovoileBoatPositions(positions, transaction);
    await transaction.commit();
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (errorMessage) {
    await saveFailedUrl(data.geovoileRace.url, errorMessage);
  } else {
    await saveSuccessfulUrl(
      data.geovoileRace.original_id,
      data.geovoileRace.url,
    );
  }

  //TODO/: await triggerWeatherSlicer(raceMetadata);
  return errorMessage;
};

module.exports = saveGeovoileData;
