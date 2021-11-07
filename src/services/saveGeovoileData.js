const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const { normalizeGeovoile } = require('./normalization/normalizeGeovoile');
const { saveCompetitionUnit } = require('./saveCompetitionUnit');
const vessel = require('../syrfDataServices/v1/vessel');
const gisUtils = require('../utils/gisUtils');

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
  if (raceData.numLegs && raceData.numLegs > 1) {
    raceData.name = `${raceData.name} - Leg ${raceData.legNum}`;
  }
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

const saveGeovoileGeometry = async (data, transaction) => {
  await db.GeovoileGeometry.bulkCreate(data, {
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
  let raceMetadata, boats;
  const positions = [];
  const existingBoats = await vessel.getExistingVesselsByScrapedUrl(
    data.geovoileRace.url,
  );
  const courseSequencedGeometries = [];
  const courseGates = [];
  let hasStartLine = false;
  let hasFinishLine = false;
  try {
    const race = await saveGeovoileRace(data.geovoileRace, transaction);

    if (data.marks) {
      for (const mark of data.marks) {
        const newPoint = gisUtils.createGeometryPoint(mark.lat, mark.lon, {
          name: mark.name?.trim() || mark.type,
          type: mark.type,
          poi: true,
        });

        courseSequencedGeometries.push({
          ...newPoint,
          id: uuidv4(),
          race_id: race.id,
          race_original_id: race.original_id,
          geometryType: 'Point',
        });
      }
      await saveGeovoileGeometry(courseSequencedGeometries, transaction);
    }

    if (data.sig && data.sig.raceGates && data.sig.raceGates.length) {
      const firstItem = data.sig.raceGates[0];
      const lastItem = data.sig.raceGates[data.sig.raceGates.length - 1];
      hasStartLine = firstItem.id?.toLowerCase().indexOf('start') >= 0;
      hasFinishLine =
        lastItem.id?.toLowerCase().indexOf('arrival') >= 0 ||
        lastItem.id?.toLowerCase().indexOf('finish') >= 0 ||
        lastItem.id?.toLowerCase().indexOf('end') >= 0;
      let order = hasStartLine ? 0 : 1;
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
          race_id: race.id,
          race_original_id: race.original_id,
          order,
          ...line,
        });
      }
      order++;
    }

    await saveGeovoileGates(courseGates, transaction);
    const sailors = [];
    boats = data.boats.map((t) => {
      const existBoat = existingBoats.find(
        (currentVessel) => currentVessel.vesselId === t.original_id,
      );
      const boatId = existBoat ? existBoat.id : uuidv4();
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
              vesselId: boatId,
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
        arrival: t.arrival,
      };
    });

    await saveGeovoileBoats(boats, transaction);
    await saveGeovoileSailors(sailors, transaction);

    await saveGeovoileBoatPositions(positions, transaction);
    raceMetadata = await normalizeGeovoile(
      { geovoileRace: race, boats: boats, sailors: sailors, positions },
      transaction,
    );

    await transaction.commit();
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  // temporary add of test env to avoid accidentally saving on maindb until its mocked
  if (
    process.env.ENABLE_MAIN_DB_SAVE_GEOVOILE === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    // create ranking
    boats.sort((a, b) => {
      const firstBoatRanking = a.arrival ? a.arrival.rank : Infinity;
      const secondBoatRanking = b.arrival ? b.arrival.rank : Infinity;

      return firstBoatRanking - secondBoatRanking;
    });

    const rankings = boats.map((b) => {
      let finishTime = 0;

      if (b.arrival) {
        if (b.arrival.timecode) {
          finishTime = b.arrival.timecode * 1000;
        } else if (b.arrival.racetime) {
          finishTime =
            (data.geovoileRace.startTime + b.arrival.racetime) * 1000;
        }
      }

      return {
        id: b.id,
        elapsedTime: b.arrival ? b.arrival.racetime * 1000 : 0,
        finishTime: finishTime,
      };
    });

    const inputBoats = boats.map((t) => {
      return vessel.createVesselObject({
        id: t.id,
        name: t.name,
        vesselId: t.original_id,
        lengthInMeters: t.lengthInMeters,
      });
    });

    if (!hasStartLine) {
      courseGates.unshift({
        ...gisUtils.createGeometryPoint(
          raceMetadata.approx_start_point.coordinates[1],
          raceMetadata.approx_start_point.coordinates[0],
        ),
        properties: {
          name: 'Start Point',
        },
        order: 0,
      });
    }
    // push finish line
    if (!hasFinishLine) {
      courseGates.push({
        ...gisUtils.createGeometryPoint(
          raceMetadata.approx_end_point.coordinates[1],
          raceMetadata.approx_end_point.coordinates[0],
        ),
        properties: {
          name: 'End Point',
        },
        order: courseGates.length,
      });
    }

    const lastItem = courseGates.pop();
    let order = courseGates.length;
    for (const currentPoint of courseSequencedGeometries) {
      courseGates.push({ ...currentPoint, order: order });
      order++;
    }
    courseGates.push({ ...lastItem, order: courseGates.length });

    await saveCompetitionUnit(
      inputBoats,
      positions,
      rankings,
      null,
      raceMetadata,
      { courseSequencedGeometries: courseGates },
    );
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

  if (raceMetadata) {
    await triggerWeatherSlicer(raceMetadata);
  }

  return errorMessage;
};

module.exports = saveGeovoileData;
