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
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeRace = async ({
    TackTrackerRace,
    TackTrackerPosition,
    TackTrackerStart,
    TackTrackerFinish,
    TackTrackerBoat,
  },
  transaction
) => {
  const TACKTRACKER_SOURCE = 'TACKTRACKER';
  const raceMetadatas = [];

  if (!TackTrackerRace || !TackTrackerPosition || TackTrackerPosition.length === 0) {
    console.log('No race or positions so skipping.');
    return;
  }

  for (const race of TackTrackerRace) {
    const allPositions = TackTrackerPosition.filter((p) => p.race === race.id && p.lat && p.lon);
    if (allPositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const startMark = TackTrackerStart?.filter((s) => s.race === race.id)?.[0];
    const finishMark = TackTrackerFinish?.filter((f) => f.race === race.id)?.[0];
    const boats = TackTrackerBoat.filter((b) => b.race === race.id);
    const id = race.id;
    const startTime = new Date(race.start).getTime();
    let endTime;
    const name = race.name;
    const event = race.regatta;
    const url = race.url;

    const boatNames = [];
    const boatModels = [];
    const boatIdentifiers = [];
    const handicapRules = [];
    const unstructuredText = [];

    boats.forEach((b) => {
        boatNames.push(b.name);
    });

    allPositions.forEach((p) => {
        p.timestamp = new Date(p.time).getTime();
        if (!endTime || endTime < p.timestamp) {
            endTime = p.timestamp;
        }
    });

    const boundingBox = turf.bbox(
        positionsToFeatureCollection('lat', 'lon', allPositions)
    );
    const boatsToSortedPositions = createBoatToPositionDictionary(
        allPositions,
        'boat',
        'timestamp'
    );
    let startPoint;
    if (startMark) {
        startPoint = findCenter(
            startMark.start_mark_lat,
            startMark.start_mark_lon,
            startMark.start_pin_lat,
            startMark.start_pin_lon
        );
    } else {
        const first3Positions = collectFirstNPositionsFromBoatsToPositions(
            boatsToSortedPositions,
            3
        );
        startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    }

    let endPoint;
    if (finishMark) {
        endPoint = findCenter(
            finishMark.finish_mark_lat,
            finishMark.finish_mark_lon,
            finishMark.finish_pin_lat,
            finishMark.finish_pin_lon
        );
    } else {
        const last3Positions = collectLastNPositionsFromBoatsToPositions(
            boatsToSortedPositions,
            3
        );
        endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
    }

    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    const raceMetadata = await createRace(
        id,
        name,
        event,
        TACKTRACKER_SOURCE,
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
        unstructuredText
    );
    const tracksGeojson = JSON.stringify(
        allPositionsToFeatureCollection(boatsToSortedPositions)
    );

    await db.readyAboutRaceMetadata.create(raceMetadata, {
        fields: Object.keys(raceMetadata),
        transaction,
    });
    await uploadGeoJsonToS3(
        race.id,
        tracksGeojson,
        TACKTRACKER_SOURCE,
        transaction
    );
    raceMetadatas.push(raceMetadata);
  }
  return raceMetadatas;
};

exports.normalizeRace = normalizeRace;
