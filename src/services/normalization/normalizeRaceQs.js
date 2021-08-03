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
    RaceQsEvent,
    RaceQsRegatta,
    RaceQsWaypoint,
    RaceQsPosition,
    RaceQsParticipant,
  },
  transaction,
) => {
  const RACEQS_SOURCE = 'RACEQS';
  const regatta = RaceQsRegatta[0];

  if (!RaceQsRegatta || !RaceQsPosition || RaceQsPosition.length === 0) {
    console.log('No event or positions so skipping.');
    return;
  }

  for (const event of RaceQsEvent) {
    const allPositions = [];
    RaceQsPosition.forEach((p) => {
      if (
        p.event_original_id === event.original_id &&
        p.lat &&
        p.lon &&
        p.time
      ) {
        p.timestamp = parseInt(p.time) * 100;
        allPositions.push(p);
      }
    });

    if (allPositions.length === 0) {
      console.log('No event positions so skipping.');
      continue;
    }
    const waypoints = RaceQsWaypoint?.filter((w) => w.event_original_id === event.original_id);
    const participants = RaceQsParticipant?.filter((p) => p.event_original_id === event.original_id);
    const id = event.id;
    const name = `${regatta.name} - ${event.name}`;
    const regattaId = event.regatta;
    const url = event.url;
    const startTime = parseInt(event.from);
    const endTime = parseInt(event.till);

    const boatIdentifiers = [];
    const boatNames = [];
    const unstructuredText = [];
    const classes = [];
    const handicaps = [];
    participants.forEach((p) => {
      boatNames.push(p.boat);
    });

    let startPoint = null;
    let endPoint = null;
    waypoints?.forEach((wpt) => {
      if (wpt.type === 'Start') {
        startPoint = createTurfPoint(wpt.lat, wpt.lon);
      } else if (wpt.type === 'Finish') {
        endPoint = createTurfPoint(wpt.lat, wpt.lon);
      }
    });

    const fc = positionsToFeatureCollection('lat', 'lon', allPositions);
    const boundingBox = turf.bbox(fc);
    const boatsToSortedPositions = createBoatToPositionDictionary(
      allPositions,
      'participant',
      'timestamp',
    );

    if (!startPoint) {
      const first3Positions = collectFirstNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    }
    if (!endPoint) {
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
      regattaId,
      RACEQS_SOURCE,
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
    await uploadGeoJsonToS3(id, tracksGeojson, RACEQS_SOURCE, transaction);

    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
  }
};

exports.normalizeRace = normalizeRace;
