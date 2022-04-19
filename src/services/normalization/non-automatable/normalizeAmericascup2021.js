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
const mapAndSave = require('../../mappingsToSyrfDB/mapAmericasCup2021ToSyrf');

const normalizeRace = async (data) => {
  const SOURCE = 'AMERICASCUP2021';
  const race = data.race;
  const positions = data.boatPositions.boatPositions;
  const boats = data.boats.boats;
  const startTime = (race.start_time + race.race_start_time) * 1000;
  const endTime = (race.max_race_time + race.start_time) * 1000;
  const boatModels = data.model;

  const boatNames = [];
  const boatIdentifiers = [];
  const handicapRules = [];
  const unstructuredText = [];

  boats.forEach((b) => {
    boatIdentifiers.push(b.original_id);
    let team = data.boats.teams.find((t) => t.id === b.team_id);
    if (team?.name) {
      boatNames.push(team.name);
    }
  });

  positions.map((p) => {
    p.time = p.coordinate_interpolator_lat_time + startTime / 1000;
    p.timestamp = parseInt(p.time);
    p.lat = p.coordinate_interpolator_lat.toString();
    p.lon = p.coordinate_interpolator_lon.toString();
  });

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
    race.race_name,
    race.event_name,
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
    boatIdentifiers,
    handicapRules,
    unstructuredText,
  );

  await mapAndSave(data, raceMetadata);
};

exports.normalizeRace = normalizeRace;
