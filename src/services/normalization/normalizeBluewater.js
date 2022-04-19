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
  createTurfPoint,
} = require('../../utils/gisUtils');

const normalizeRace = async ({
  BluewaterRace,
  BluewaterPosition,
  BluewaterMap,
  BluewaterBoat,
  BluewaterBoatHandicap,
}) => {
  const BLUEWATER_SOURCE = 'BLUEWATER';
  const race = BluewaterRace[0];
  const positions = BluewaterPosition;
  const map = BluewaterMap[0];
  const boats = BluewaterBoat;
  const handicaps = BluewaterBoatHandicap;
  const startTime = new Date(race.start_time).getTime();
  const endTime = new Date(race.track_time_finish).getTime();

  positions.forEach((p) => {
    p.timestamp = new Date(p.date).getTime();
    p.lat = p.coordinate_1;
    p.lon = p.coordinate_0;
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    positions,
    'boat_original_id',
    'timestamp',
  );

  const start = JSON.parse(map.start_line);
  const end = JSON.parse(map.finish_line);
  const course = JSON.parse(map.course);

  let startPoint = null;
  if (start.length === 2) {
    const sideA = start[0];
    const sideB = start[1];
    startPoint = findCenter(sideA[1], sideA[0], sideB[1], sideB[0]);
  } else if (course.length > 0) {
    const startT = course[0];
    startPoint = createTurfPoint(startT[1], startT[0]);
  } else {
    const first3Positions = collectFirstNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    startPoint = getCenterOfMassOfPositions(
      'coordinate_1',
      'coordinate_0',
      first3Positions,
    );
  }

  let endPoint = null;
  if (end.length === 2) {
    const sideA = end[0];
    const sideB = end[1];
    endPoint = findCenter(sideA[1], sideA[0], sideB[1], sideB[0]);
  } else if (course.length > 0) {
    const courseLength = course.length;
    const endT = course[courseLength - 1];
    endPoint = createTurfPoint(endT[1], endT[0]);
  } else {
    const last3Positions = collectLastNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    endPoint = getCenterOfMassOfPositions(
      'coordinate_1',
      'coordinate_0',
      last3Positions,
    );
  }
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('coordinate_1', 'coordinate_0', positions),
  );

  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIdentifiers = [];
  const unstructuredText = [];
  for (const i in boats) {
    const b = boats[i];
    boatNames.push(b.name);
    boatModels.push(b.design);
    boatIdentifiers.push(b.mmsi);
    boatIdentifiers.push(b.sail_no);
    unstructuredText.push(b.bio);

    const handicapName = handicaps?.filter((b) => b.boat === b.id)?.name;
    if (handicapName && !handicapRules.includes(handicapName)) {
      handicapRules.push(handicapName);
    }
  }

  const roughLength = findAverageLength(
    'coordinate_1',
    'coordinate_0',
    boatsToSortedPositions,
  );

  return await createRace(
    race.id,
    race.name,
    null, // event name
    null, // event id
    BLUEWATER_SOURCE,
    race.referral_url,
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
};

exports.normalizeRace = normalizeRace;
