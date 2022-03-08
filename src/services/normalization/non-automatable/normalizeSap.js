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
const mapAndSave = require('../../mappingsToSyrfDB/mapSapToSyrf');

const normalizeRace = async ({
  SapRace,
  SapBoat,
  SapPosition,
  SapMarks,
  SapMarkPositions,
  SapMarkPassings,
}) => {
  const SOURCE = 'SAP';
  const race = SapRace;
  const positions = SapPosition;
  const boats = SapBoat;
  const startTime = race.start_of_tracking_ms;
  const endTime = race.end_of_tracking_ms;

  const boatNames = [];
  const boatModels = [];
  const identifiers = [];
  const handicapRules = [];
  const unstructuredText = [];

  boats.forEach((b) => {
    boatNames.push(b.name);
    boatModels.push(b.boat_class_name);
  });

  positions.map((p) => {
    p.time = p.timepoint_ms / 1000;
    p.timestamp = p.timepoint_ms;
    p.lat = p.lat_deg.toString();
    p.lon = p.lng_deg.toString();
  });

  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', positions),
  );
  const boatsToSortedPositions = createBoatToPositionDictionary(
    positions.filter((p) => p.competitor_boat_id),
    'competitor_boat_id',
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
  const raceMetadata = await createRace(
    race.id,
    race.name,
    race.regatta, // event name
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
    true, // Skip elastic search for now since race does not have url
  );

  await mapAndSave(
    SapRace,
    SapBoat,
    SapPosition,
    SapMarks,
    SapMarkPositions,
    SapMarkPassings,
    raceMetadata,
  );
};

exports.normalizeRace = normalizeRace;
