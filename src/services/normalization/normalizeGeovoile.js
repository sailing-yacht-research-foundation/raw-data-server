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
const competitionUnit = require('../../syrfDataServices/v1/competitionUnit');
const vessel = require('../../syrfDataServices/v1/vessel');
const vesselParticipant = require('../../syrfDataServices/v1/vesselParticipant');
const vesselParticipantGroup = require('../../syrfDataServices/v1/vesselParticipantGroup');
const courses = require('../../syrfDataServices/v1/courses');

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

  try {
    // 1. Save calendar event information
    const newCalendarEvent = await calendarEvent.upsert(
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
      mainDatabaseTransaction,
    );
    // Create vessel participant group
    const vesselGroup = await vesselParticipantGroup.upsert(
      null,
      {
        calendarEventId: newCalendarEvent.id,
        name: '',
      },
      null,
      mainDatabaseTransaction,
    );

    // Save vessels information
    let vessels = [];
    // TODO: get existing vessel information to reuse
    // in case there is no existing vessels, then create new one
    for (const boat of boats) {
      const currentVessel = await vessel.upsert(
        null,
        {
          publicName: boat.name,
          vesselId: boat.original_id, // TODO save by root url + boat original id
          lengthInMeters: null,
          orcJsonPolars: {},
          bulkCreated: true,
        },
        null,
        mainDatabaseTransaction,
      );
      vessels.push(currentVessel);
    }
    for (const currentVessel of vessels) {
      await vesselParticipant.upsert(
        null,
        {
          vesselId: currentVessel.id,
          vesselParticipantGroupId: vesselGroup.id,
        },
        null,
        mainDatabaseTransaction,
      );
    }
    // Save competition unit information
    const newCompetitionUnit = await competitionUnit.upsert(
      null,
      {
        isCompleted: true,
        calendarEventId: newCalendarEvent.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        approximateStart: new Date(startTime).toISOString(),
        description: '',
        name,
        approximateStart_zone: 'Etc/UTC',
        boundingBox: {
          type: 'Polygon',
          coordinates: boundingBox.coordinates,
        },
        vesselParticipantGroupId: vesselGroup.id,
      },
      null,
      mainDatabaseTransaction,
    );
    await courses.upsert(null, {
      competitionUnitId: newCompetitionUnit.id,
      calendarEventId: newCalendarEvent.id,
      name,
      // something like bounding box
      courseSequencedGeometries: newCompetitionUnit.boundingBox,
      // course related geometries (start line, gates, finish line etc)
      courseUnsequencedUntimedGeometry: [
        {
          geometryType: 'Polyline',
          order: 0,
          coordinates: [
            {
              position: startPoint.geometry.coordinates[0],
              properties: {
                name: 'Start Point',
              },
            },
            {
              position: startPoint.geometry.coordinates[1],
              properties: {},
            },
          ],
        },
        {
          geometryType: 'Polyline',
          order: 1,
          coordinates: [
            {
              position: startPoint.geometry.coordinates[1],
              properties: {
                name: 'End Point',
              },
            },
            {
              position: endPoint.geometry.coordinates[0],
              properties: {},
            },
          ],
        },
      ],
      courseUnsequencedTimedGeometry: null, // no used atm
    });
    // TODO:
    // 5. Publish the position to rabbit mq using @syrf/transport-library
    // 6. Call analysis engine to stopCompetition (generate geo json per participant)

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
