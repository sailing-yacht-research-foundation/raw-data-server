const turf = require('@turf/turf');
const db = require('../../../models');
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
} = require('../../../utils/gisUtils');
const uploadUtil = require('../../uploadUtil');

const normalizeRace = async (
  {
    AmericasCupRegatta,
    AmericasCupRace,
    AmericasCupBoat,
    AmericasCupMarks,
    AmericasCupPosition,
  },
  transaction,
) => {
  console.log('Normalizing start');
  const SOURCE = 'AMERICASCUP';
  const regatta = AmericasCupRegatta;
  const race = AmericasCupRace;
  const boats = AmericasCupBoat?.filter((b) => (b.type === 'Yacht'));
  const boatPositions = AmericasCupPosition?.filter(
    (p) => p.boat_type === 'Yacht',
  );

  if (!race || !boatPositions?.length) {
    console.log('No race or boat positions so skipping.', race?.original_id);
    return;
  }
  let startDate = new Date(race.start_time);
  let startTime;
  if (startDate?.toString() !== 'Invalid Date' && !isNaN(startDate)) {
    startTime = startDate.getTime();
  } else {
    startDate = new Date(race.start_time.replace('Y', 'T'));
    startTime = startDate.getTime();
  }
  let endTime;

  boatPositions.forEach((p) => {
    if (!endTime || endTime < p.timestamp) {
      endTime = p.timestamp;
    }
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    boatPositions,
    'boat',
    'timestamp',
  );

  const startMarks = [];
  const finishMarks = [];
  AmericasCupMarks?.forEach((m) => {
    if (m.name.toLowerCase().indexOf('start') > -1) {
      const existingMark = startMarks.find((sm) => sm.name === m.name);
      const isLatestMark =
        existingMark?.compound_mark_original_id > m.compound_mark_original_id;
      if (!existingMark || isLatestMark) {
        startMarks.push(m);
      }
    } else if (m.name.toLowerCase().indexOf('finish') > -1) {
      const existingMark = finishMarks.find((sm) => sm.name === m.name);
      const isLatestMark =
        existingMark?.compound_mark_original_id > m.compound_mark_original_id;
      if (!existingMark || isLatestMark) {
        finishMarks.push(m);
      }
    }
  });

  let startPoint;
  if (startMarks.length > 1) {
    startPoint = findCenter(
      startMarks[0].lat,
      startMarks[0].lon,
      startMarks[1].lat,
      startMarks[1].lon,
    );
  } else {
    const first3Positions = collectFirstNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
  }

  let endPoint;
  if (finishMarks.length > 1) {
    endPoint = findCenter(
      finishMarks[0].lat,
      finishMarks[0].lon,
      finishMarks[1].lat,
      finishMarks[1].lon,
    );
  } else {
    const last3Positions = collectLastNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
  }
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', boatPositions),
  );

  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIdentifiers = [];
  const unstructuredText = [];
  const event = regatta.id;
  boats?.forEach((b) => {
    boatNames.push(b.boat_name);
    boatModels.push(b.model);
    boatIdentifiers.push(b.stowe_name);
    unstructuredText.push(b.short_name);
    unstructuredText.push(b.shorter_name);
    unstructuredText.push(b.skipper);
  });

  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);

  const name = `${regatta.name} ${race.name}`;

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
    boatIdentifiers,
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
