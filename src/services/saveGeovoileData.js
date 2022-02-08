const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const { normalizeGeovoile } = require('./normalization/normalizeGeovoile');
const gisUtils = require('../utils/gisUtils');
const mapGeovoileToSyrf = require('./mappingsToSyrfDB/mapGeovoileToSyrf');

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

const _processGeovoileRaceName = (raceData) => {
  if (raceData.numLegs && raceData.numLegs > 1) {
    raceData.name = `${raceData.name} - Leg ${raceData.legNum}`;
  }
  return raceData;
};

const saveGeovoileRace = async (raceData, transaction) => {
  await db.geovoileRace.create(raceData, { transaction });
  return raceData;
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

const saveGeovoileMarks = async (data, transaction) => {
  if (!data) {
    return;
  }
  await db.geovoileMark.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return data;
};

const saveGeovoileGates = async (data, transaction) => {
  await db.GeovoileGeometryGate.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
  return data;
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
  let raceMetadata;
  const courseGates = [];
  if (data.sig && data.sig.raceGates && data.sig.raceGates.length) {
    let order = 0;
    for (const gate of data.sig.raceGates) {
      const line = gisUtils.createGeometryLine(
        {
          lat: gate._pointA[1],
          lon: gate._pointA[0],
        },
        {
          lat: gate._pointB[1],
          lon: gate._pointB[0],
        },
        { name: gate.id },
      );
      courseGates.push({
        id: uuidv4(),
        race_id: data.geovoileRace.id,
        race_original_id: data.geovoileRace.original_id,
        order,
        ...line,
      });
    }
    order++;
  }
  if (process.env.ENABLE_MAIN_DB_SAVE_GEOVOILE !== 'true') {
    try {
      _processGeovoileRaceName(data.geovoileRace);
      await saveGeovoileRace(data.geovoileRace, transaction);
      await saveGeovoileMarks(data.marks, transaction);
      await saveGeovoileGates(courseGates, transaction);
      await saveGeovoileBoats(data.boats, transaction);
      await saveGeovoileSailors(data.sailors, transaction);
      await saveGeovoileBoatPositions(data.positions, transaction);
      raceMetadata = await normalizeGeovoile(data, transaction);

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (errorMessage) {
      await saveFailedUrl(data.geovoileRace.url, errorMessage);
      if (data.geovoileRace.url !== data.geovoileRace.scrapedUrl) {
        await saveFailedUrl(data.geovoileRace.scrapedUrl, errorMessage);
      }
    } else {
      await saveSuccessfulUrl(
        data.geovoileRace.original_id,
        data.geovoileRace.url,
      );

      if (data.geovoileRace.url !== data.geovoileRace.scrapedUrl) {
        await saveSuccessfulUrl(
          data.geovoileRace.original_id,
          data.geovoileRace.scrapedUrl,
        );
      }
    }
  }

  // temporary add of test env to avoid accidentally saving on maindb until its mocked
  if (
    process.env.ENABLE_MAIN_DB_SAVE_GEOVOILE === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    try {
      raceMetadata = await normalizeGeovoile(data, transaction);
      await mapGeovoileToSyrf({ ...data, courseGates }, raceMetadata);
    } catch (err) {
      console.log(err);
    }
  }

  if (raceMetadata) {
    await triggerWeatherSlicer(raceMetadata);
  }

  return errorMessage;
};

module.exports = saveGeovoileData;
