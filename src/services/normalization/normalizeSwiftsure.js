const turf = require('@turf/turf');
const db = require('../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  findCenter,
  createRace,
  allPositionsToFeatureCollection,
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeRace = async (
  { SwiftsureRace, SwiftsureBoat, SwiftsurePosition, SwiftsureLine },
  transaction,
) => {
  const SOURCE = 'SWIFTSURE';
  const race = SwiftsureRace[0];
  const positions = SwiftsurePosition;
  const boats = SwiftsureBoat;
  const startTime = race.race_start * 1000;
  let endTime;

  positions.forEach((p) => {
    p.timestamp = p.timestamp * 1000;
    if (!endTime || endTime < p.timestamp) {
      endTime = p.timestamp;
    }
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    positions,
    'boat',
    'timestamp',
  );

  const startLine = SwiftsureLine?.find(
    (l) => l.name.toLowerCase().indexOf('start') > -1,
  );
  const finishLine = SwiftsureLine?.find(
    (l) => l.name.toLowerCase().indexOf('finish') > -1,
  );

  let startPoint;
  if (startLine) {
    startPoint = findCenter(
      startLine.lat1,
      startLine.lon1,
      startLine.lat2,
      startLine.lon2,
    );
  } else {
    const first3Positions = collectFirstNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
  }

  let endPoint;
  if (finishLine) {
    endPoint = findCenter(
      finishLine.lat1,
      finishLine.lon1,
      finishLine.lat2,
      finishLine.lon2,
    );
  } else {
    const last3Positions = collectLastNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
  }
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', positions),
  );

  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIdentifiers = [];
  const unstructuredText = [];
  for (const i in boats) {
    const b = boats[i];
    boatNames.push(b.boat_name);
    boatModels.push(b.make);
    boatIdentifiers.push(b.boat_id);
    unstructuredText.push(b.team_name);
    unstructuredText.push(b.skipper);
  }

  const roughLength = findAverageLength(
    'coordinate_1',
    'coordinate_0',
    boatsToSortedPositions,
  );

  const name = race.welcome.match(/\>(.*)<\/h1>/)?.[1] || '';

  const raceMetadata = await createRace(
    race.id,
    name,
    null, // event name
    null, // event id
    SOURCE,
    race.url,
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
    await uploadGeoJsonToS3(race.id, tracksGeojson, SOURCE, transaction);
  }
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
