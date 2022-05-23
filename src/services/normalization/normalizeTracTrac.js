const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
} = require('../../utils/gisUtils');

const normalizeRace = async ({
  TracTracEvent,
  TracTracRace,
  TracTracCompetitorPosition,
  TracTracClass,
  TracTracRaceClass,
  TracTracCompetitor,
}) => {
  const TRACTRAC_SOURCE = 'TRACTRAC';
  const raceMetadatas = [];
  const esBodies = [];

  if (
    !TracTracRace ||
    !TracTracCompetitorPosition ||
    TracTracCompetitorPosition.length === 0
  ) {
    throw new Error('No race or positions so skipping.');
  }

  const event = TracTracEvent?.[0];
  for (const race of TracTracRace) {
    const id = race.id;
    let startTime;
    let endTime;
    const raceStart = new Date(`${race.race_start} +0`);
    const raceEnd = new Date(`${race.race_end} +0`);
    if (race.race_start && !isNaN(raceStart)) {
      startTime = raceStart.getTime();
    } else {
      startTime = new Date(`${race.tracking_start} +0`).getTime();
    }

    if (race.race_end && !isNaN(raceEnd)) {
      endTime = raceEnd.getTime();
    } else {
      endTime = new Date(`${race.tracking_stop} +0`).getTime();
    }

    const url = race.url;
    const handicapRules =
      race.race_handicap && race.race_handicap !== 'NONE'
        ? [race.race_handicap]
        : [];
    const unstructuredText = [];
    const allPositions = TracTracCompetitorPosition.filter(
      (p) => p.race_original_id === race.original_id,
    );
    if (allPositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }

    const raceClassIds = TracTracRaceClass.filter(
      (rc) => rc.race === race.id,
    ).map((rc) => rc.boat_class);
    const classes = TracTracClass.filter((c) => raceClassIds.includes(c.id));
    const competitors = TracTracCompetitor.filter(
      (c) => c.race_original_id === race.original_id,
    );

    const boatNames = competitors.map((c) => c.short_name);
    const boatModels = classes.map((c) => c.name);
    const boatIdentifiers = classes.map((c) => c.original_id);

    let startPoint = null;
    let endPoint = null;

    const boundingBox = turf.bbox(
      positionsToFeatureCollection('lat', 'lon', allPositions),
    );
    const boatsToSortedPositions = createBoatToPositionDictionary(
      allPositions,
      'competitor',
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
    const { raceMetadata, esBody } = await createRace(
      id,
      race.name,
      event?.name,
      event?.id,
      TRACTRAC_SOURCE,
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
    raceMetadatas.push(raceMetadata);
    esBodies.push(esBody);
  }
  return { raceMetadatas, esBodies };
};

exports.normalizeRace = normalizeRace;
