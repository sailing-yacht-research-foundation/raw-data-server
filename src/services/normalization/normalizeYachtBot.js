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
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeRace = async (
  { YachtBotRace, YachtBotPosition, YachtBotYacht },
  transaction,
) => {
  const YACHTBOT_SOURCE = 'YACHTBOT';
  if (!YachtBotRace || !YachtBotPosition || YachtBotPosition.length === 0) {
    console.log('No race or positions so skipping.');
    return;
  }
  const race = YachtBotRace[0];
  const allPositions = YachtBotPosition;
  const boats = YachtBotYacht;
  const id = race.id;
  const startTime = parseInt(race.start_time);
  const endTime = parseInt(race.end_time);
  const name = race.name;
  const url = race.url;

  const boatNames = [];
  const boatModels = [];
  const boatIdentifiers = [];
  const handicapRules = [];
  const unstructuredText = [];

  boats.forEach((b) => {
    boatIdentifiers.push(b.boat_number);
  });

  allPositions.forEach((p) => {
    p.timestamp = parseInt(p.time);
  });

  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions.filter((p) => p.yacht),
    'yacht',
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

  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
  const raceMetadata = await createRace(
    id,
    name,
    null, // event name
    null, // event id
    YACHTBOT_SOURCE,
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
    boatIdentifiers,
    handicapRules,
    unstructuredText,
  );
  if (process.env.ENABLE_MAIN_DB_SAVE_YACHTBOT !== 'true') {
    const tracksGeojson = JSON.stringify(
      allPositionsToFeatureCollection(boatsToSortedPositions),
    );
    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
    await uploadGeoJsonToS3(
      race.id,
      tracksGeojson,
      YACHTBOT_SOURCE,
      transaction,
    );
  }
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
