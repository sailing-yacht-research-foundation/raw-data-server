const turf = require('@turf/turf');
const db = require('../../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  allPositionsToFeatureCollection,
} = require('../../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../../uploadUtil');

const normalizeRace = async (
  {
    AmericasCup2021Race,
    AmericasCup2021Boat,
    AmericasCup2021Position,
    AmericasCup2021Team,
    AmericasCup2021Model,
  },
  transaction,
) => {
  const SOURCE = 'AMERICASCUP2021';
  const race = AmericasCup2021Race[0];
  const positions = AmericasCup2021Position;
  const boats = AmericasCup2021Boat;
  const id = race.id;
  const name = race.race_name;
  const event = race.event_name;
  const url = '';
  const startTime = race.start_time * 1000;
  const endTime = (race.max_race_time - race.min_race_time) * 1000 + startTime;
  const boatModels = AmericasCup2021Model;

  const boatNames = [];
  const identifiers = [];
  const handicapRules = [];
  const unstructuredText = [];

  boats.forEach((b) => {
    let boatName = AmericasCup2021Team.find((t) => t.id === b.team_id);
    boatNames.push(name ? boatName.boat_name : 'No Name');
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
  const tracksGeojson = JSON.stringify(
    allPositionsToFeatureCollection(boatsToSortedPositions),
  );
  await uploadGeoJsonToS3(race.id, tracksGeojson, SOURCE, transaction);
};

exports.normalizeRace = normalizeRace;
