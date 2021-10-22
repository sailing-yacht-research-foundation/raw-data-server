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
const VesselParticipantTrack = require('../../syrfDataServices/v1/vesselParticipantTrack');
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
  let name = race.name;

  if (race.numLegs && race.numLegs > 1) {
    name = `${name} - Leg ${race.legNum}`;
  }
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
    null, // event name
    null, // event id
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
    console.log('Create new calendar event');
    // 1. Save calendar event information
    const newCalendarEvent = await calendarEvent.upsert(
      {
        name,
        externalUrl: race.url,
        approximateStartTime: startTime,
        approximateEndTime: endTime,
        lon: startPoint.geometry.coordinates[0],
        lat: startPoint.geometry.coordinates[1],
        source: GEOVOILE_SOURCE,
        isOpen: false,
        isPubliclyViewable: true,
        approximateStartTime_zone: 'Etc/UTC',
        approximateEndTime_zone: 'Etc/UTC',
        editors: [],
      },
      mainDatabaseTransaction,
    );
    // Create vessel participant group
    console.log('Create new vesselGroup');
    const vesselGroup = await vesselParticipantGroup.upsert(
      {
        calendarEventId: newCalendarEvent.id,
      },
      mainDatabaseTransaction,
    );

    console.log('Create new vessels');
    // Save vessels information
    let vessels = [];
    // TODO: get existing vessel information to reuse
    // in case there is no existing vessels, then create new one

    const vesselOriginalIdMap = new Map();
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
      vesselOriginalIdMap.set(boat.original_id, currentVessel.id);
    }
    console.log(`Save vessel participants`);
    const vesselParticipants = new Map();
    for (const currentVessel of vessels) {
      const result = await vesselParticipant.upsert(
        null,
        {
          vesselId: currentVessel.id,
          vesselParticipantGroupId: vesselGroup.id,
        },
        null,
        mainDatabaseTransaction,
      );
      vesselParticipants.set(result.vesselId, result.id);
    }
    console.log(`Create new Competition Unit`);
    const boundingBoxGeometry = turf.bboxPolygon(boundingBox);
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
        boundingBox: boundingBoxGeometry.geometry,
        vesselParticipantGroupId: vesselGroup.id,
      },
      null,
      mainDatabaseTransaction,
    );

    console.log(`Creating new Course`);
    await courses.upsert(null, {
      competitionUnitId: newCompetitionUnit.id,
      calendarEventId: newCalendarEvent.id,
      name,
      // something like bounding box
      courseSequencedGeometries: [
        {
          geometryType: 'Polygon',
          order: 0,
          coordinates: boundingBoxGeometry.geometry.coordinates[0].map((t) => {
            return { position: t };
          }),
        },
      ],
      // course related geometries (start line, gates, finish line etc)
      courseUnsequencedUntimedGeometry: [
        {
          geometryType: 'Point',
          order: 0,
          coordinates: [
            {
              position: startPoint.geometry.coordinates,
              properties: {
                name: 'Start Point',
              },
            },
          ],
        },
        {
          geometryType: 'Point',
          order: 1,
          coordinates: [
            {
              position: endPoint.geometry.coordinates,
              properties: {
                name: 'End Point',
              },
            },
          ],
        },
      ],
      courseUnsequencedTimedGeometry: [], // no used atm
    });

    mainDatabaseTransaction.commit();

    // Create the participant track
    const vesselParticipantTracks = {};
    for (const currentParticipant of vesselParticipants.values()) {
      vesselParticipantTracks[currentParticipant] = new VesselParticipantTrack(
        currentParticipant,
      );
    }
    for (const position of allPositions) {
      const vesselId = vesselOriginalIdMap.get(position.boat_original_id);
      const tracker = vesselParticipantTracks[vesselParticipants.get(vesselId)];
      tracker.addNewPosition(
        [position.lon, position.lat],
        position.timecode * 1000,
        {
          cog: position.heading,
        },
        {},
      );
    }
    boats.sort((a, b) => {
      const firstBoatRanking = a.arrival ? a.arrival.rank : Infinity;
      const secondBoatRanking = b.arrival ? b.arrival.rank : Infinity;

      return firstBoatRanking - secondBoatRanking;
    });
    const rankings = boats.map((t) => {
      const vesselId = vesselOriginalIdMap.get(t.original_id);
      const vesselParticipantId = vesselParticipants.get(vesselId);
      return {
        vesselParticipantId: vesselParticipantId,
        elapsedTime: t.arrival ? t.arrival.racetime * 1000 : 0,
        finishTime: t.arrival ? t.arrival.timecode * 1000 : 0,
      };
    });
    await competitionUnit.stopCompetition(
      newCompetitionUnit.id,
      vesselParticipantTracks,
      {},
      rankings,
    );
    console.log('Finish saving geovoile into main database');
  } catch (e) {
    console.log('Error during saving geovoile into main database');
    console.log(e);
    mainDatabaseTransaction.rollback();
  }

  return raceMetadata;
};

exports.normalizeGeovoile = normalizeGeovoile;
