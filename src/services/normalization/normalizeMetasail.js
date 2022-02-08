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
const METASAIL_SOURCE = 'METASAIL';

const normalizeRace = async (
  { MetasailEvent, MetasailRace, MetasailBoat, MetasailPosition },
  transaction,
) => {
  if (!MetasailPosition || MetasailPosition.length === 0) {
    console.log('No positions, skip');
    return;
  }
  const raceMetadatas = [];
  const event = MetasailEvent?.[0];
  for (const race of MetasailRace) {
    const id = race.id;
    const url = race.url;
    const startTime = parseInt(race.start);
    const endTime = parseInt(race.stop);
    const original_id = race.original_id;

    const classes = [event?.category_text];
    const boatNames = [];
    const identifiers = [];
    const handicapRules = [];
    const unstructuredText = [];
    let raceBoat = MetasailBoat.filter(
      (x) => x.race_original_id === original_id,
    );
    let racePositions = MetasailPosition.filter(
      (x) => x.race_original_id === original_id,
    );
    if (racePositions.length === 0) {
      console.log('No race positions, skip');
      continue;
    }

    raceBoat.forEach((b) => {
      boatNames.push(b.name);
    });

    racePositions.forEach((p) => {
      p.timestamp = parseInt(p.time);
    });
    const boundingBox = turf.bbox(
      positionsToFeatureCollection('lat', 'lon', racePositions),
    );
    const boatsToSortedPositions = createBoatToPositionDictionary(
      racePositions,
      'boat',
      'time',
    );
    const first3Positions = collectFirstNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    const startPoint = getCenterOfMassOfPositions(
      'lat',
      'lon',
      first3Positions,
    );

    const last3Positions = collectLastNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    const endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);

    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);

    const raceMetadata = await createRace(
      id,
      race.name,
      event?.name,
      event?.id,
      METASAIL_SOURCE,
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
      identifiers,
      handicapRules,
      unstructuredText,
    );
    if (process.env.ENABLE_MAIN_DB_SAVE_METASAIL !== 'true') {
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
        METASAIL_SOURCE,
        transaction,
      );
    }
    raceMetadatas.push(raceMetadata);
  }
  return raceMetadatas;
};

exports.normalizeRace = normalizeRace;
