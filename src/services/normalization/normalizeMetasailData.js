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

  for (const index in MetasailRace) {
    const race = MetasailRace[index];

    const id = race.id;
    const name = MetasailEvent.name + ' - ' + race.name;
    const eventId = race.event;
    const url = race.url;
    const startTime = parseInt(race.start);
    const endTime = parseInt(race.stop);
    const original_id = race.original_id;

    const classes = [MetasailEvent.category_text];
    const boatNames = [];
    const identifiers = [];
    const handicapRules = [];
    const unstructuredText = [];
    let RaceMetasailBoat = MetasailBoat.filter(
      (x) => x.race_original_id == original_id,
    );
    let RaceMetasailPosition = MetasailPosition.filter(
      (x) => x.race_original_id == original_id,
    );

    RaceMetasailBoat.forEach((b) => {
      boatNames.push(b.name);
    });

    RaceMetasailPosition.forEach((p) => {
      p.timestamp = parseInt(p.time);
    });
    const boundingBox = turf.bbox(
      positionsToFeatureCollection('lat', 'lon', RaceMetasailPosition),
    );
    const boatsToSortedPositions = createBoatToPositionDictionary(
      RaceMetasailPosition,
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

    console.log('F');
    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    console.log('G');

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
    console.log('H');
    const tracksGeojson = JSON.stringify(
      allPositionsToFeatureCollection(boatsToSortedPositions),
    );
    console.log('I');
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
