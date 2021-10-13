const turf = require('@turf/turf');
const db = require('../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  createTurfPoint,
  allPositionsToFeatureCollection,
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeRace = async (
  { EstelaRace, EstelaPosition, EstelaDorsal, EstelaBuoy },
  transaction,
) => {
  const ESTELA_SOURCE = 'ESTELA';
  const race = EstelaRace[0];
  const allPositions = EstelaPosition;
  const allBuoys = EstelaBuoy;
  const boats = EstelaDorsal;
  const id = race.id;
  const name = race.name;
  const url = race.url;
  const startTime = new Date(race.start_timestamp * 1000).getTime();
  const endTime = new Date(race.end_timestamp * 1000).getTime();
  let startPoint = createTurfPoint(race.initLat, race.initLon);

  if (allPositions.length === 0) {
    console.log('No positions so skipping.');
    return;
  }

  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions,
    'dorsal',
    'timestamp',
  );
  const last3Positions = collectLastNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  let endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
  const buoys = allBuoys.filter((b) => b.race === race.id && b.door);
  if (buoys.length > 1) {
    buoys.sort((a, b) => (parseInt(a.index) > parseInt(b.index) ? 1 : -1));

    const startBuoy = buoys[0];
    const endBuoy = buoys[buoys.length - 1];
    if (startBuoy.lat !== null && startBuoy.lon !== null) {
      startPoint = createTurfPoint(startBuoy.lat, startBuoy.lon);
    }
    if (endBuoy.lat !== null && endBuoy.lon !== null) {
      endPoint = createTurfPoint(endBuoy.lat, endBuoy.lon);
    }
  }
  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIdentifiers = [];
  const unstructuredText = [];

  for (const boatIndex in boats) {
    const b = boats[boatIndex];
    boatNames.push(b.name);
    boatModels.push(b.model);
    boatIdentifiers.push(b.mmsi);
    boatIdentifiers.push(b.number);
  }

  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
  const raceMetadata = await createRace(
    id,
    name,
    null, // event name
    null, // event id
    ESTELA_SOURCE,
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
  const tracksGeojson = JSON.stringify(
    allPositionsToFeatureCollection(boatsToSortedPositions),
  );

  await db.readyAboutRaceMetadata.create(raceMetadata, {
    fields: Object.keys(raceMetadata),
    transaction,
  });
  await uploadGeoJsonToS3(race.id, tracksGeojson, ESTELA_SOURCE, transaction);
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
