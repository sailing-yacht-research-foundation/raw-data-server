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
  allPositionsToFeatureCollection,
  findCenter,
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadFileToS3');

const normalizeRace = async (
  { iSailRace, iSailPosition, iSailStartline, iSailEventParticipant },
  transaction,
) => {
  const ISAIL_SOURCE = 'ISAIL';
  const allPositions = iSailPosition;
  const startLines = iSailStartline;
  const boats = iSailEventParticipant;
  if (!iSailRace || !allPositions || allPositions.length === 0) {
    console.log('No race or positions so skipping.');
    return;
  }
  for (const race of iSailRace) {
    const id = race.id;
    const name = race.name;
    const event = race.event;
    const url = race.url;
    const startTime = new Date(race.start * 1000).getTime();
    const endTime = new Date(race.stop * 1000).getTime();
    const boundingBox = turf.bbox(
      positionsToFeatureCollection('lat', 'lon', allPositions),
    );
    allPositions.forEach((p) => {
      p.timestamp = p.time;
    });
    const boatsToSortedPositions = createBoatToPositionDictionary(
      allPositions,
      'participant',
      'time',
    );

    const startObj = startLines?.find((sl) => sl.name === 'start');
    const endObj = startLines?.find((sl) => sl.name === 'finish');
    let startPoint, endPoint;
    if (startObj) {
      startPoint = findCenter(
        startObj.lat_1,
        startObj.lon_1,
        startObj.lat_2,
        startObj.lon_2,
      );
    } else {
      const first3Positions = collectFirstNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    }
    if (endObj) {
      endPoint = findCenter(
        endObj.lat_1,
        endObj.lon_1,
        endObj.lat_2,
        endObj.lon_2,
      );
    } else {
      const last3Positions = collectLastNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
    }

    const boatNames = [];
    const boatModels = [];
    const handicapRules = [];
    const boatIdentifiers = [];
    const unstructuredText = [];
    boats?.forEach((b) => {
      boatNames.push(b.name);
      boatModels.push(b.class_name);
      boatIdentifiers.push(b.sail_no);
    });
    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    const raceMetadata = await createRace(
      id,
      name,
      event,
      ISAIL_SOURCE,
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
    await uploadGeoJsonToS3(race.id, tracksGeojson, ISAIL_SOURCE, transaction);
  };
};

exports.normalizeRace = normalizeRace;
