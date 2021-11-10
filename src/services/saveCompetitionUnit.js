const { createTransaction } = require('../syrf-schema/utils/utils');
const failedUrlDataAccess = require('../syrf-schema/dataAccess/v1/scrapedFailedUrl');
const successfulUrlDataAccess = require('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const calendarEvent = require('../syrfDataServices/v1/calendarEvent');
const competitionUnit = require('../syrfDataServices/v1/competitionUnit');
const vessel = require('../syrfDataServices/v1/vessel');
const vesselParticipant = require('../syrfDataServices/v1/vesselParticipant');
const vesselParticipantGroup = require('../syrfDataServices/v1/vesselParticipantGroup');
const courses = require('../syrfDataServices/v1/courses');
const participant = require('../syrfDataServices/v1/participant');
const VesselParticipantTrack = require('../syrfDataServices/v1/vesselParticipantTrack');
const { createGeometryPoint } = require('../utils/gisUtils');

const saveCompetitionUnit = async ({
  event,
  race,
  boats,
  positions,
  rankings,
  raceMetadata,
  courseSequencedGeometries = [],
  handicapMap = {},
}) => {
  const {
    id: raceId,
    name,
    source,
    url,
    approx_start_time_ms: approxStartTimeMs,
    approx_end_time_ms: approxEndTimeMs,
    approx_start_point: approxStartPoint,
    approx_end_point: approxEndPoint,
    bounding_box: boundingBox,
    approx_start_lat: lat,
    approx_start_lon: lon,
    start_country: country,
    start_city: city,
    open_graph_image: openGraphImage,
  } = raceMetadata;
  const mainDatabaseTransaction = await createTransaction();

  try {
    console.log('Create new calendar event');
    // 1. Save calendar event information
    const newCalendarEvent = await calendarEvent.upsert(
      event?.id,
      {
        name: event?.name,
        externalUrl: event?.url || url,
        approximateStartTime: event?.approxStartTimeMs || approxStartTimeMs,
        approximateEndTime: event?.approxEndTimeMs || approxEndTimeMs,
        lat: event?.lat || lat,
        lon: event?.lon || lon,
        source,
        country: event?.country || country,
        city: event?.city || city,
        openGraphImage,
        scrapedOriginalId: event?.original_id,
      },
      mainDatabaseTransaction,
    );
    // Create vessel participant group
    console.log('Create new vesselGroup');
    const vesselGroup = await vesselParticipantGroup.upsert(
      null,
      {
        calendarEventId: newCalendarEvent.id,
      },
      mainDatabaseTransaction,
    );

    console.log('Create new vessels and save participants');
    // Save vessels information
    const vesselsToParticipantsMap = new Map();
    const vesselsToSave = [];
    const vesselParticipantsToSave = [];
    const existingVesselIdMap = new Map(); // mapping of existing vessel id with its new id to replace the positions boat ids
    const existingVessels = await vessel.getVesselsByVesselIdsAndSource(
      boats.map((b) => b.vesselId),
      source,
    );
    for (const boat of boats) {
      const existingVessel = existingVessels?.find(
        (ev) => ev.vesselId === boat.vesselId,
      );
      if (existingVessel) {
        existingVesselIdMap.set(boat.id, existingVessel.id);
        boat.id = existingVessel.id;
        boat.handicap = Object.assign(
          {},
          existingVessel.handicap,
          boat.handicap,
        );
      }
      vesselsToSave.push({
        id: boat.id,
        publicName: boat.name || boat.publicName,
        globalId: boat.globalId,
        vesselId: boat.vesselId,
        model: boat.model,
        lengthInMeters: boat.lengthInMeters,
        widthInMeters: boat.widthInMeters,
        draftInMeters: boat.draftInMeters,
        handicap: boat.handicap,
        source,
      });

      let boatHandicap = boat.handicap;
      if (handicapMap && handicapMap[boat.id]) {
        boatHandicap = handicapMap[boat.id];
      }
      vesselParticipantsToSave.push({
        vesselId: boat.id,
        vesselParticipantGroupId: vesselGroup.id,
        handicap: boatHandicap,
      });
      if (boat.crews) {
        vesselsToParticipantsMap.set(boat.id, boat.crews);
      }
    }
    await vessel.bulkCreate(vesselsToSave, mainDatabaseTransaction);
    const createdVesselParticipants = await vesselParticipant.bulkCreate(
      vesselParticipantsToSave,
      mainDatabaseTransaction,
    );

    rankings = rankings?.map((t) => {
      const vesselId = existingVesselIdMap.get(t.id) || t.id; // replace vessel id if already exist
      const vesselParticipantId = createdVesselParticipants.find(
        (vp) => vp.vesselId === vesselId,
      )?.id;
      return {
        vesselParticipantId: vesselParticipantId,
        elapsedTime: t.elapsedTime,
        finishTime: t.finishTime,
      };
    });

    console.log(`Save Participants and Crew`);
    for (const vesselId of vesselsToParticipantsMap.keys()) {
      const participants = vesselsToParticipantsMap.get(vesselId);
      const vesselParticipantId = createdVesselParticipants.find(
        (vp) => vp.vesselId === vesselId,
      )?.id;
      const addedParticipants = await participant.bulkCreate(
        participants.map((p) => ({
          ...p,
          calendarEventId: newCalendarEvent.id,
        })),
        mainDatabaseTransaction,
      );

      if (addedParticipants?.length) {
        await vesselParticipant.addParticipant(
          {
            vesselParticipantId,
            participantIds: addedParticipants.map((p) => p.id),
          },
          mainDatabaseTransaction,
        );
      }
    }

    console.log(`Creating new Course`);
    // add default value in case there is no point or mark
    if (courseSequencedGeometries.length === 0) {
      courseSequencedGeometries.push(
        ...[
          Object.assign(
            createGeometryPoint({
              lon: approxStartPoint.coordinates[0],
              lat: approxStartPoint.coordinates[1],
              properties: {
                name: 'Start Point',
              },
            }),
            {
              order: 0,
            },
          ),
          Object.assign(
            createGeometryPoint({
              lon: approxEndPoint.coordinates[0],
              lat: approxEndPoint.coordinates[1],
              properties: {
                name: 'End Point',
              },
            }),
            {
              order: 1,
            },
          ),
        ],
      );
    }

    const createdCourse = await courses.upsert(
      null,
      {
        calendarEventId: newCalendarEvent.id,
        name,
        courseSequencedGeometries,
      },
      mainDatabaseTransaction,
    );

    console.log(`Create new Competition Unit`);
    // Save competition unit information
    const newCompetitionUnit = await competitionUnit.upsert(
      raceId,
      {
        name,
        approximateStartLocation: approxStartPoint,
        approximateEndLocation: approxEndPoint,
        startTime: new Date(approxStartTimeMs).toISOString(),
        approximateStart: new Date(approxStartTimeMs).toISOString(),
        boundingBox,
        vesselParticipantGroupId: vesselGroup.id,
        courseId: createdCourse.id,
        calendarEventId: newCalendarEvent.id,
        endTime: new Date(approxEndTimeMs).toISOString(),
        country,
        city,
        openGraphImage,
        scrapedOriginalId: race.original_id,
        scrapedUrl: race.url,
      },
      mainDatabaseTransaction,
    );

    // Create the participant track
    const vesselParticipantTracks = {};
    for (const currentParticipant of createdVesselParticipants) {
      const participantId = currentParticipant.id;
      vesselParticipantTracks[participantId] = new VesselParticipantTrack(
        participantId,
      );
    }
    for (const position of positions) {
      const vesselId =
        existingVesselIdMap.get(position.vesselId) || position.vesselId; // replace vessel id if already exist
      const vesselParticipantId = createdVesselParticipants.find(
        (vp) => vp.vesselId === vesselId,
      )?.id;
      const tracker = vesselParticipantTracks[vesselParticipantId];
      tracker?.addNewPosition(
        [position.lon, position.lat],
        position.timestamp,
        {
          cog: position.cog,
          sog: position.sog,
          twa: position.twa,
          windSpeed: position.windSpeed,
          windDirection: position.windDirection,
        },
        {},
      );
    }

    // Remove vessel participant track that does not have positions
    for (const vesselParticipantId in vesselParticipantTracks) {
      const track = vesselParticipantTracks[vesselParticipantId];
      if (!track.positions?.length) {
        delete vesselParticipantTracks[vesselParticipantId];
      }
    }

    await competitionUnit.stopCompetition(
      newCompetitionUnit.id,
      vesselParticipantTracks,
      {},
      rankings,
    );

    await successfulUrlDataAccess.create(
      {
        url: race.scrapedUrl || race.url || url,
        originalId: race.original_id,
        source,
        createdAt: Date.now(),
      },
      mainDatabaseTransaction,
    );

    await mainDatabaseTransaction.commit();
    console.log(`Finish saving competition unit ${raceId} into main database`);
  } catch (err) {
    console.log(
      `Error during saving competition unit ${raceId} into main database`,
      err,
    );
    await mainDatabaseTransaction.rollback();

    await failedUrlDataAccess.create({
      url: race.scrapedUrl || race.url || url,
      error: err.toString(),
      source,
      createdAt: Date.now(),
    });
  }
};

exports.saveCompetitionUnit = saveCompetitionUnit;
