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
const { uploadGeoJsonToS3 } = require('../uploadFileToS3');
const METASAIL_SOURCE = 'METASAIL';

const normalizeRace = async (
  { MetasailEvent, MetasailRace, MetasailBoat, MetasailPosition },
  transaction,
) => {
  console.log('Normalize data');
  if (!MetasailPosition || MetasailPosition.length === 0) {
    console.log('No positions, skip');
    return;
  }

  for (const race of MetasailRace) {
    const id = race.id;
    const name = MetasailEvent[0].name + ' - ' + race.name;
    const eventId = race.event;
    const url = race.url;
    const startTime = parseInt(race.start);
    const endTime = parseInt(race.stop);
    const original_id = race.original_id;

    const classes = [MetasailEvent[0].category_text];
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
      name,
      eventId,
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
};

exports.normalizeRace = normalizeRace;
