const turf = require('@turf/turf');
const db = require('../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  createTurfPoint,
  allPositionsToFeatureCollection,
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeRace = async (
  {
    KwindooRace,
    KwindooRegatta,
    KwindooBoat,
    KwindooWaypoint,
    KwindooPosition,
    KwindooRunningGroup,
  },
  transaction,
) => {
  const KWINDOO_SOURCE = 'KWINDOO';
  const regatta = KwindooRegatta[0];
  const raceMetadatas = [];
  const runningGroups = KwindooRunningGroup;
  if (!KwindooRace || !KwindooPosition || KwindooPosition.length === 0) {
    console.log('No race or positions so skipping.');
    return;
  }

  for (const race of KwindooRace) {
    const boats = KwindooBoat.filter((b) => b.race_original_id === race.original_id);
    const waypoints = KwindooWaypoint?.filter((b) => b.race_original_id === race.original_id);
    const allPositions = [];
    KwindooPosition.forEach((p) => {
      if (p.race_original_id === race.original_id && p.lat && p.lon && p.t) {
        p.timestamp = parseInt(p.t) * 1000;
        allPositions.push(p);
      }
    });
    if (allPositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const id = race.id;
    const name = `${regatta.name} - ${race.name}`;
    const event = race.regatta;
    const url = race.url;
    const startTime = parseInt(race.start_timestamp) * 1000;
    const endTime = parseInt(race.end_timestamp) * 1000;
    const classes = [];
    const handicaps = [];
    runningGroups?.forEach((rg) => {
      if (
        rg.name !== 'All classes' &&
        rg.name !== 'All 1' &&
        rg.name !== 'All 2'
      ) {
        if (rg.name.includes('ORC') || rg.name.includes('PHRF')) {
          handicaps.push(rg.name);
        } else {
          classes.push(rg.name);
        }
      }
    });

    const boatIdentifiers = [];
    const boatNames = [];
    const unstructuredText = [];
    boats.forEach((b) => {
      boatIdentifiers.push(b.registry_number);
      boatIdentifiers.push(b.sail_number);
      boatNames.push(b.boat_name);
      classes.push(b.class);
    });

    let startPoint = null;
    let endPoint = null;
    waypoints?.forEach((wpt) => {
      if (wpt.role === 'start') {
        startPoint = createTurfPoint(
          wpt.primary_marker_lat,
          wpt.primary_marker_lon,
        );
      } else if (wpt.role === 'finish') {
        endPoint = createTurfPoint(
          wpt.primary_marker_lat,
          wpt.primary_marker_lon,
        );
      }
    });

    const fc = positionsToFeatureCollection('lat', 'lon', allPositions);
    const boundingBox = turf.bbox(fc);
    const boatsToSortedPositions = createBoatToPositionDictionary(
      allPositions,
      'boat',
      'timestamp',
    );

    if (startPoint === null) {
      const first3Positions = collectFirstNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    }
    if (endPoint === null) {
      const last3Positions = collectLastNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
    }

    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    const raceMetadata = await createRace(
      id,
      name,
      event,
      KWINDOO_SOURCE,
      url,
      startTime,
      endTime,
      startPoint,
      endPoint,
      boundingBox,
      roughLength,
      boatsToSortedPositions,
      boatNames,
      classes,
      boatIdentifiers,
      handicaps,
      unstructuredText,
    );

    const tracksGeojson = JSON.stringify(
      allPositionsToFeatureCollection(boatsToSortedPositions),
    );

    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
    await uploadGeoJsonToS3(id, tracksGeojson, KWINDOO_SOURCE, transaction);
    raceMetadatas.push(raceMetadata);
  }
  return raceMetadatas;
};

exports.normalizeRace = normalizeRace;
