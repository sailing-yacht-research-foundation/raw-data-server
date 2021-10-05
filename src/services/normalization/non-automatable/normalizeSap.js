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
const uploadUtil = require('../../uploadUtil');

const normalizeRace = async (
  { SapRace, SapBoat, SapPosition },
  transaction,
) => {
  const SOURCE = 'SAP';
  const race = SapRace[0];
  const positions = SapPosition;
  const boats = SapBoat;
  const name = `${race.regatta} - ${race.name}`;
  const event = null;
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
    name,
    event,
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
  const tracksGeojson = JSON.stringify(
    allPositionsToFeatureCollection(boatsToSortedPositions),
  );

  const metadata = await db.readyAboutRaceMetadata.findOne({
    where: {
      id: raceMetadata.id,
    },
    raw: true,
  });

  if (!metadata) {
    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
    console.log('uploading geojson');
    await uploadUtil.uploadGeoJsonToS3(
      race.id,
      tracksGeojson,
      SOURCE,
      transaction,
    );
  }
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
