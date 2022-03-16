const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  findCenter,
  createRace,
} = require('../../../utils/gisUtils');

const normalizeRace = async ({
  AmericasCupRegatta,
  AmericasCupRace,
  AmericasCupBoat,
  AmericasCupMarks,
  AmericasCupPosition,
}) => {
  console.log('Normalizing start');
  const SOURCE = 'AMERICASCUP';
  const regatta = AmericasCupRegatta[0];
  const race = AmericasCupRace;
  const boats = AmericasCupBoat?.filter((b) => b.type === 'Yacht');
  const boatPositions = AmericasCupPosition?.filter(
    (p) => p.boat_type === 'Yacht',
  );
  if (!race || !boats?.length || !boatPositions?.length) {
    throw new Error(
      `No race or boats or positions for race ${race?.original_id}. Skipping.`,
    );
  }
  let startDate = new Date(race.start_time);
  let startTime;
  if (startDate?.toString() !== 'Invalid Date' && !isNaN(startDate)) {
    startTime = startDate.getTime();
  } else {
    startDate = new Date(race.start_time.replace('Y', 'T'));
    startTime = startDate.getTime();
  }
  let endTime = race.end_time;

  if (!endTime) {
    boatPositions.forEach((p) => {
      if (!endTime || endTime < p.timestamp) {
        endTime = p.timestamp;
      }
    });
  }
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
  boats?.forEach((b) => {
    boatNames.push(b.boat_name);
    boatModels.push(b.model);
    boatIdentifiers.push(b.stowe_name);
    unstructuredText.push(b.short_name);
    unstructuredText.push(b.shorter_name);
    unstructuredText.push(b.skipper);
  });

  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);

  const raceMetadata = await createRace(
    race.id,
    race.name,
    regatta.name,
    regatta.id,
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
  );
  return raceMetadata;
};

exports.normalizeRace = normalizeRace;
