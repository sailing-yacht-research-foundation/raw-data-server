const turf = require('@turf/turf');
const {
  createTurfPoint,
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
} = require('../../utils/gisUtils');

const normalizeRace = async ({
  YellowbrickEvent,
  YellowbrickRace,
  YellowbrickPosition,
  YellowbrickCourseNode,
  YellowbrickTeam,
  YellowbrickTag,
}) => {
  if (
    !YellowbrickRace ||
    !YellowbrickPosition ||
    YellowbrickPosition.length === 0
  ) {
    throw new Error('No race or positions so skipping.');
  }
  const YELLOWBRICK_SOURCE = 'YELLOWBRICK';
  const event = YellowbrickEvent?.[0];
  const race = YellowbrickRace[0];
  const allPositions = YellowbrickPosition;
  const nodes = YellowbrickCourseNode;
  const boats = YellowbrickTeam;
  const tags = YellowbrickTag;
  const id = race.id;
  const startTime = parseInt(race.start) * 1000;
  const endTime = parseInt(race.stop) * 1000;
  const name = race.title;
  const url = race.url;

  const boatNames = [];
  const boatModels = [];
  const boatIdentifiers = [];
  const handicapRules = [];
  const unstructuredText = [];
  let startPoint = null;
  let endPoint = null;

  if (nodes && nodes.length > 0) {
    nodes.sort((a, b) => (parseInt(a.order) > parseInt(b.order) ? 1 : -1));
    startPoint = createTurfPoint(nodes[0].lat, nodes[0].lon);
    endPoint = createTurfPoint(
      nodes[nodes.length - 1].lat,
      nodes[nodes.length - 1].lon,
    );
  }

  boats?.forEach((b) => {
    boatIdentifiers.push(b.sail);
    boatNames.push(b.name);
    boatModels.push(b.model);
  });

  tags?.forEach((t) => {
    handicapRules.push(t.handicap);
  });

  allPositions.forEach((p) => {
    p.timestamp = parseInt(p.timestamp);
  });

  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions,
    'team',
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
  return await createRace(
    id,
    name,
    event?.name,
    event?.id,
    YELLOWBRICK_SOURCE,
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
};

exports.normalizeRace = normalizeRace;
