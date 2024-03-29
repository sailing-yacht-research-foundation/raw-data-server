const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
} = require('../../utils/gisUtils');

const normalizeRace = async ({
  YachtBotRace,
  YachtBotPosition,
  YachtBotYacht,
}) => {
  const YACHTBOT_SOURCE = 'YACHTBOT';
  if (!YachtBotRace || !YachtBotPosition || YachtBotPosition.length === 0) {
    throw new Error('No race or positions so skipping.');
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
  return await createRace(
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
};

exports.normalizeRace = normalizeRace;
