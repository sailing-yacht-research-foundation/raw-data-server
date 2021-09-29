const turf = require('@turf/turf');
const db = require('../../models');
const {
  createTurfPoint,
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  allPositionsToFeatureCollection,
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeGeovoile = async (
  { geovoileRace, boats, sailors, positions },
  transaction,
) => {
  const GEOVOILE_SOURCE = 'GEOVOILE';
  const race = geovoileRace;
  const allPositions = positions;
  if (!allPositions || allPositions.length === 0) {
    console.log('No positions so skipping.');
    return;
  }
  const id = race.id;
  const name = race.name;
  const event = null;
  const url = race.url;
  const startTime = race.startTime;
  const endTime = race.endTime;
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  allPositions.forEach((p) => {
    p.time = p.timecode;
    p.timestamp = p.timecode; // Needed for function allPositionsToFeatureCollection
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions,
    'boat_original_id',
    'timecode',
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
    boatIds.push(b.original_id);
  });
  for (const sailor of sailors || []) {
    unstructuredText.push(`${sailor.first_name} ${sailor.last_name}`);
  }
  const raceMetadata = await createRace(
    id,
    name,
    event,
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
  const tracksGeojson = JSON.stringify(
    allPositionsToFeatureCollection(boatsToSortedPositions),
  );
  // await db.readyAboutRaceMetadata.create(raceMetadata, {
  //   fields: Object.keys(raceMetadata),
  //   transaction,
  // });
  // await uploadGeoJsonToS3(race.id, tracksGeojson, GEOVOILE_SOURCE, transaction);
  // return raceMetadata;
};

exports.normalizeGeovoile = normalizeGeovoile;
