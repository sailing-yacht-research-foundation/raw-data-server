const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
} = require('../../../utils/gisUtils');

const normalizeRace = async ({
  OldGeovoileRace,
  OldGeovoileBoat,
  OldGeovoilePosition,
}) => {
  const SOURCE = 'OLDGEOVOILE';
  const race = OldGeovoileRace[0];
  const positions = OldGeovoilePosition;
  const boats = OldGeovoileBoat;
  const startTime = race.start_time;
  let endTime = race.end_time;

  const boatNames = [];
  const boatModels = [];
  const identifiers = [];
  const handicapRules = [];
  const unstructuredText = [];

  boats.forEach((b) => {
    boatNames.push(b.name);
  });

  let positionEndTime;
  positions.map((p) => {
    if (p.timestamp > positionEndTime || !positionEndTime)
      positionEndTime = p.timestamp;
    p.time = p.timestamp / 1000;
    p.lat = +p.lat;
    p.lon = +p.lon;
  });

  if (!endTime) endTime = positionEndTime;

  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', positions),
  );
  const boatsToSortedPositions = createBoatToPositionDictionary(
    positions.filter((p) => p.boat_id),
    'boat_id',
    'time',
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
  const { raceMetadata } = await createRace(
    race.id,
    race.name,
    null, // event name
    null, // event id
    SOURCE,
    '', // url
    startTime,
    endTime,
    startPoint,
    endPoint,
    boundingBox,
    roughLength,
    boatsToSortedPositions,
    boatNames,
    boatModels,
    identifiers,
    handicapRules,
    unstructuredText,
  );
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
