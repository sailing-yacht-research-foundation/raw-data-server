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
  { OldGeovoileRace, OldGeovoileBoat, OldGeovoilePosition },
  transaction,
) => {
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
  const raceMetadata = await createRace(
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
