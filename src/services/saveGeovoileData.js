const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const { normalizeGeovoile } = require('./normalization/normalizeGeovoile');
const mapGeovoileToSyrf = require('./mappingsToSyrfDB/mapGeovoileToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('./s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

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
  let errorMessage = '';
  let raceMetadata;

  if (process.env.ENABLE_MAIN_DB_SAVE_GEOVOILE !== 'true') {
    const transaction = await db.sequelize.transaction();
    try {
      await saveGeovoileRace(data.geovoileRace, transaction);
      await saveGeovoileMarks(data.marks, transaction);
      await saveGeovoileGates(data.courseGates, transaction);
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
      const { geovoileRace } = data;
      const isUnfinished =
        geovoileRace.eventState !== 'FINISH' &&
        geovoileRace.raceState !== 'FINISH';
      if (isUnfinished) {
        console.log(
          `Future race detected for race scrapedUrl = ${geovoileRace.scrapedUrl}`,
        );
        try {
          // The deletion of previous elastic search is on a different endpoint and will be triggered by the tracker-scraper
          await _indexUnfinishedRaceToES(geovoileRace, data);
        } catch (err) {
          console.log(
            `Failed indexing unfinished race scrapedUrl ${geovoileRace.scrapedUrl}`,
            err,
          );
        }
      } else {
        raceMetadata = await normalizeGeovoile(data);
        await mapGeovoileToSyrf(data, raceMetadata);
      }
    } catch (err) {
      console.log(err);
      errorMessage = databaseErrorHandler(err);
    }
  }

  if (!errorMessage && raceMetadata) {
    await triggerWeatherSlicer(raceMetadata);
  }

  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const startTimeMs = race.startTime * 1000;
  const startDate = new Date(startTimeMs);
  const startMark = data.marks?.find(
    (mark) => mark?.type.toLowerCase()?.indexOf('start') >= 0,
  );
  const startGate = data.courseGates?.find(
    (gate) => gate.properties?.name?.toLowerCase()?.indexOf('start') >= 0,
  );
  let startPoint;
  if (startMark) {
    startPoint = createTurfPoint(startMark.lat, startMark.lon);
  } else if (!startMark && startGate) {
    const coordinate = startGate.coordinates[0];
    startPoint = createTurfPoint(
      coordinate.position[1],
      coordinate.position[0],
    );
  }

  const body = {
    id: race.id,
    name: race.name,
    source: SOURCE.GEOVOILE,
    url: race.scrapedUrl,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: (race.endTime || 0) * 1000,
    open_graph_image: getTrackerLogoUrl(SOURCE.GEOVOILE),
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.scrapedUrl,
  };

  if (startPoint) {
    body.approx_start_point = startPoint.geometry;
    const { countryName, cityName } = await getCountryAndCity({
      lon: startPoint.geometry.coordinates[0],
      lat: startPoint.geometry.coordinates[1],
    });

    if (countryName) {
      body.start_country = countryName;
    }
    if (cityName) {
      body.start_city = cityName;
    }
  }
  await elasticsearch.indexRace(race.id, body);
};

module.exports = saveGeovoileData;
