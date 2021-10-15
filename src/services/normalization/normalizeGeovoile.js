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
const uploadUtil = require('../uploadUtil');

const { createTransaction } = require('../../syrf-schema/utils/utils');
const calendarEvent = require('../../syrfDataServices/v1/calendarEvent');
const normalizeGeovoile = async (
  { geovoileRace, boats, sailors, positions },
  transaction,
) => {
  const GEOVOILE_SOURCE = 'GEOVOILE';
  const race = geovoileRace;
  const allPositions = positions;
  if (!allPositions || allPositions.length === 0) {
    console.log('No positions so skipping.');
    return;
  }
  const id = race.id;
  const name = race.name;
  const event = null;
  const url = race.url;
  const startTime = race.startTime * 1000;
  const endTime = race.endTime * 1000;
  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', allPositions),
  );
  allPositions.forEach((p) => {
    p.time = p.timecode;
    p.timestamp = p.timecode * 1000; // Needed for function allPositionsToFeatureCollection
  });
  const boatsToSortedPositions = createBoatToPositionDictionary(
    allPositions,
    'boat_id',
    'timestamp',
  );

  const first3Positions = collectFirstNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  const startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
  const last3Positions = collectLastNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  const endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);

  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIds = [];
  const unstructuredText = [];
  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);

  boats?.forEach((b) => {
    if (b.name) {
      boatNames.push(b.name);
    }
    boatIds.push(b.id);
  });
  for (const sailor of sailors || []) {
    unstructuredText.push(`${sailor.first_name} ${sailor.last_name}`);
  }

  const raceMetadata = await createRace(
    id,
    name,
    event,
    GEOVOILE_SOURCE,
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
    boatIds,
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
  console.log('uploading geojson');
  await uploadUtil.uploadGeoJsonToS3(
    race.id,
    tracksGeojson,
    GEOVOILE_SOURCE,
    transaction,
  );

  const mainDatabaseTransaction = await createTransaction();
  // TODO:
  // 1. Save calendar event information
  // 2. Save race information
  // 3. Save boat information
  // 4. Save sailor information
  // 5. Publish the position to rabbit mq using @syrf/transport-library
  // 6. Call analysis engine to stopCompetition (generate geo json per participant)
  try {
    calendarEvent.upsert(
      null,
      {
        name,
        description: '',
        isPrivate: false,
        approximateStartTime: new Date(startTime).toISOString(),
        approximateEndTime: new Date(endTime).toISOString(),
        lon: startPoint.geometry.coordinates[0],
        lat: startPoint.geometry.coordinates[1],
        source: GEOVOILE_SOURCE,
        isOpen: false,
        isPubliclyViewable: true,
        approximateStartTime_zone: 'Etc/UTC',
        approximateEndTime_zone: 'Etc/UTC',
        externalUrl: race.url,
        // Internet Calendar Scheduling (ics)
        ics: null,
        editors: [],
      },
      null,
    );
    mainDatabaseTransaction.commit();
    console.log('Finish saving geovoile into main database');
  } catch (e) {
    console.log('Error duing saving geovoile into main database');
    console.log(e);
    mainDatabaseTransaction.rollback();
  }

  return raceMetadata;
};

exports.normalizeGeovoile = normalizeGeovoile;
