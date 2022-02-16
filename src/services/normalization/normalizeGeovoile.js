const turf = require('@turf/turf');
const db = require('../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  allPositionsToFeatureCollection,
} = require('../../utils/gisUtils');
const { SOURCE } = require('../../constants');
const uploadUtil = require('../uploadUtil');

const normalizeGeovoile = async (
  { geovoileRace, boats, sailors, positions },
  transaction,
) => {
  const GEOVOILE_SOURCE = SOURCE.GEOVOILE;
  const race = geovoileRace;
  const allPositions = positions;
  if (!allPositions || allPositions.length === 0) {
    console.log('No positions so skipping.');
    return;
  }
  const id = race.id;
  const name = race.name;

  const url = race.url;
  const startTime = race.startTime * 1000;
  const endTime = race.endTime * 1000;
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  allPositions.forEach((p) => {
    p.time = p.timecode;
    p.cog = p.heading;
    p.timestamp = p.timecode * 1000; // Needed for function allPositionsToFeatureCollection
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions,
    'boat_id',
    'timestamp',
  );

  const first3Positions = collectFirstNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  const startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
  const last3Positions = collectLastNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  const endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);

  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIds = [];
  const unstructuredText = [];
  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);

  boats?.forEach((b) => {
    if (b.name) {
      boatNames.push(b.name);
    }
    boatIds.push(b.id);
  });
  for (const sailor of sailors || []) {
    unstructuredText.push(`${sailor.first_name} ${sailor.last_name}`);
  }

  const raceMetadata = await createRace(
    id,
    name,
    null, // event name
    null, // event id
    GEOVOILE_SOURCE,
    url,
    startTime,
    endTime,
    startPoint,
    endPoint,
    boundingBox,
    roughLength,
    boatsToSortedPositions,
    boatNames,
    boatModels,
    boatIds,
    handicapRules,
    unstructuredText,
  );
  if (process.env.ENABLE_MAIN_DB_SAVE_GEOVOILE !== 'true') {
    const tracksGeojson = JSON.stringify(
      allPositionsToFeatureCollection(boatsToSortedPositions),
    );
    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
    console.log('uploading geojson');
    await uploadUtil.uploadGeoJsonToS3(
      race.id,
      tracksGeojson,
      GEOVOILE_SOURCE,
      transaction,
    );
  }

  return raceMetadata;
};

exports.normalizeGeovoile = normalizeGeovoile;
