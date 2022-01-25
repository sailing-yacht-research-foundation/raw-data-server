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
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadUtil');

const normalizeRace = async (
  {
    TracTracEvent,
    TracTracRace,
    TracTracCompetitorPosition,
    TracTracClass,
    TracTracRaceClass,
    TracTracCompetitor,
  },
  transaction,
) => {
  const TRACTRAC_SOURCE = 'TRACTRAC';
  const raceMetadatas = [];

  if (
    !TracTracRace ||
    !TracTracCompetitorPosition ||
    TracTracCompetitorPosition.length === 0
  ) {
    console.log('No race or positions so skipping.');
    return;
  }

  const event = TracTracEvent?.[0];
  for (const race of TracTracRace) {
    const id = race.id;
    const startTime = new Date(race.tracking_start).getTime();
    const endTime = new Date(race.tracking_stop).getTime();
    const url = race.url;
    const handicapRules = [race.race_handicap];
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
    const raceMetadata = await createRace(
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
    if (process.env.ENABLE_MAIN_DB_SAVE_TRACTRAC !== 'true') {
      const tracksGeojson = JSON.stringify(
        allPositionsToFeatureCollection(boatsToSortedPositions),
      );
      await db.readyAboutRaceMetadata.create(raceMetadata, {
        fields: Object.keys(raceMetadata),
        transaction,
      });
      await uploadGeoJsonToS3(
        race.id,
        tracksGeojson,
        TRACTRAC_SOURCE,
        transaction,
      );
    }
    raceMetadatas.push(raceMetadata);
  }
  return raceMetadatas;
};

exports.normalizeRace = normalizeRace;
