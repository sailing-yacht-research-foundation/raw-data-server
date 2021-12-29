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
const THRESHOLD_TIME = 600000;
const moment = require('moment');

const normalizeRace = async (
  {
    RaceQsEvent,
    RaceQsRegatta,
    RaceQsWaypoint,
    RaceQsPosition,
    RaceQsParticipant,
    RaceQsDivision,
    RaceQsStart,
    RaceQsRoute,
  },
  transaction,
) => {
  const RACEQS_SOURCE = 'RACEQS';
  const regatta = RaceQsRegatta?.[0];
  const raceMetadatas = [];

  if (!RaceQsRegatta || !RaceQsPosition || RaceQsPosition.length === 0) {
    console.log('No event or positions so skipping.');
    return;
  }
  const availablePositions = [];
  RaceQsPosition.forEach((p) => {
    if (p.lat && p.lon && p.time) {
      p.timestamp = parseInt(p.time) * 100;
      availablePositions.push(p);
    }
  });
  availablePositions.sort((a, b) => a.timestamp - b.timestamp);

  if (availablePositions.length === 0) {
    console.log('No event positions so skipping.');
    return;
  }
  const event = RaceQsEvent[0];
  for (const [index, division] of RaceQsDivision.entries()) {
    const starts = RaceQsStart?.filter((t) => t.division === division.id) || [];
    // if there is no start so we will take the first division only
    if ((!RaceQsStart || !RaceQsStart?.length) && index > 0) {
      continue;
    }
    do {
      const start = starts.shift();
      const waypoints = _getWayPoints(start, RaceQsWaypoint, RaceQsRoute);

      const allPositions = _getAllPositions(availablePositions, start);

      if (!allPositions.length) {
        console.log(
          `No positions for start ${start?.id}, from = ${start?.from} is found`,
        );
        continue;
      }
      let startPoint = null;
      let endPoint = null;
      waypoints?.forEach((wpt) => {
        if (wpt.type === 'Start') {
          startPoint = createTurfPoint(wpt.lat, wpt.lon);
        } else if (wpt.type === 'Finish') {
          endPoint = createTurfPoint(wpt.lat, wpt.lon);
        }
      });
      const participants = _getParticipants(start, RaceQsParticipant);
      const id = start?.id || division.id;
      const url = event.url;
      const startTime = start ? parseInt(start.from) : parseInt(event.from);
      const endTime = parseInt(event.till);
      const boatIdentifiers = [];
      const boatNames = [];
      const unstructuredText = [];
      const classes = [];
      const handicaps = [];
      if (start?.type) {
        handicaps.push(start.type);
      }
      participants.forEach((p) => {
        boatNames.push(p.boat);
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
      const roughLength = findAverageLength(
        'lat',
        'lon',
        boatsToSortedPositions,
      );
      const raceName = _getRaceName(regatta, division, start, event);
      const raceMetadata = await createRace(
        id,
        raceName, // for raceQs event is race
        regatta?.name,
        regatta?.id,
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
      await db.readyAboutRaceMetadata.create(raceMetadata, {
        fields: Object.keys(raceMetadata),
        transaction,
      });
      await uploadGeoJsonToS3(id, tracksGeojson, RACEQS_SOURCE, transaction);
      raceMetadatas.push(raceMetadata);
    } while (starts.length);
  }
  return raceMetadatas;
};

const _getWayPoints = (start, raceQsWaypoint, raceQsRoute) => {
  if (!start) {
    return [];
  }
  const availableWayPoints = new Set(
    raceQsRoute.filter((t) => t.start === start.id).map((t) => t.waypoint),
  );
  return raceQsWaypoint.filter((t) => availableWayPoints.has(t.id));
};

const _getParticipants = (start, raceQsParticipant) => {
  return raceQsParticipant
    ?.filter((b) => {
      if (start && b.start && b.finish) {
        const boatStartTime = new Date(b.start);
        const boatFinishTime = new Date(b.finish);
        if (
          boatStartTime.getTime() <= start.from &&
          boatFinishTime >= start.from
        ) {
          return b;
        }
        return null;
      }
      return b;
    })
    .filter((t) => t);
};

const _getAllPositions = (allPositions, start) => {
  if (!start) {
    return allPositions;
  }
  const lowestTime = start.from - THRESHOLD_TIME;

  return allPositions.filter((t) => t.timestamp >= lowestTime);
};
const _getRaceName = (regatta, division, start, raceQsEvent) => {
  const raceNames = [regatta.name, division.name];

  if (start?.from && raceQsEvent.tz) {
    const startTime = moment(start.from).utcOffset(raceQsEvent.tz);
    raceNames.push(startTime.format('HH:mm:ss'));
  }

  return raceNames.filter((t) => t).join(' - ');
};
exports.normalizeRace = normalizeRace;
