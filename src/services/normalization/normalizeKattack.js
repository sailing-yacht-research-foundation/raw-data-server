const turf = require('@turf/turf');
const db = require('../../models');
const {
  createTurfPoint,
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
  { KattackRace, KattackPosition, KattackWaypoint, KattackDevice },
  transaction,
) => {
  const KATTACK_SOURCE = 'KATTACK';
  const race = KattackRace[0];
  const allPositions = KattackPosition;
  const waypoints = KattackWaypoint;
  const devices = KattackDevice;
  if (!allPositions || allPositions.length === 0) {
    console.log('No positions so skipping.');
    return;
  }
  const id = race.id;
  const name = race.name;
  const url = race.url;
  const startTime = +race.race_start_time_utc;
  const endTime = +race.race_start_time_utc + race.race_length_sec * 1000;
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  allPositions.forEach((p) => {
    p.time = parseInt(p.time);
    p.timestamp = p.time; // Needed for function allPositionsToFeatureCollection
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions,
    'device',
    'time',
  );

  const startObj = waypoints?.find(
    (wp) => wp.name.toLowerCase().indexOf('start') > -1,
  );
  const endObj = waypoints?.find(
    (wp) => wp.name.toLowerCase().indexOf('finish') > -1,
  );
  let startPoint, endPoint;
  if (race.original_paradigm === 'Race') {
    // Race paradigm has relative positions
    startPoint = createTurfPoint(race.lat, race.lon);
  } else if (startObj) {
    startPoint = createTurfPoint(startObj.lat, startObj.lon);
  } else {
    const first3Positions = collectFirstNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
  }
  if (endObj) {
    endPoint = createTurfPoint(endObj.lat, endObj.lon);
  } else {
    const last3Positions = collectLastNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
  }

  const deviceNames = [];
  const boatModels = [];
  const handicapRules = [];
  const deviceIdentifiers = [];
  const unstructuredText = [];
  devices?.forEach((d) => {
    deviceNames.push(d.name);
    deviceIdentifiers.push(d.sail_no);
  });
  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
  // Exclude buoy races for now bec buoy race positions are relative to an undetermined position and always in Ghana
  const shouldIncludeToES = !(url.indexOf('BuoyPlayer.aspx') > -1);
  const raceMetadata = await createRace(
    id,
    name,
    null, // event name
    null, // event id
    KATTACK_SOURCE,
    url,
    startTime,
    endTime,
    startPoint,
    endPoint,
    boundingBox,
    roughLength,
    boatsToSortedPositions,
    deviceNames,
    boatModels,
    deviceIdentifiers,
    handicapRules,
    unstructuredText,
    shouldIncludeToES,
  );
  if (process.env.ENABLE_MAIN_DB_SAVE_KATTACK !== 'true') {
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
      KATTACK_SOURCE,
      transaction,
    );
  }
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
