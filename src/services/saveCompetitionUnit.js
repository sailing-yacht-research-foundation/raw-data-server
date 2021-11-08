const { createTransaction } = require('../syrf-schema/utils/utils');
const calendarEvent = require('../syrfDataServices/v1/calendarEvent');
const competitionUnit = require('../syrfDataServices/v1/competitionUnit');
const vessel = require('../syrfDataServices/v1/vessel');
const vesselParticipant = require('../syrfDataServices/v1/vesselParticipant');
const vesselParticipantGroup = require('../syrfDataServices/v1/vesselParticipantGroup');
const courses = require('../syrfDataServices/v1/courses');
const participant = require('../syrfDataServices/v1/participant');
const VesselParticipantTrack = require('../syrfDataServices/v1/vesselParticipantTrack');

const saveCompetitionUnit = async ({
  event,
  race,
  boats,
  positions,
  rankings,
  raceMetadata,
  courseSequencedGeometries = [],
}) => {
  console.log('race original_id', race.original_id);
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
    const vesselParticipantsMap = new Map();
    const vesselParticipantToParticipantsMap = new Map();
    const existingVesselIdMap = new Map(); // mapping of existing vessel id with its new id to replace the positions boat ids
    for (const boat of boats) {
      const existingVessel = await vessel.getVesselByVesselIdAndSource(
        boat.vesselId,
        source,
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
      const currentVessel = await vessel.upsert(
        boat.id,
        {
          publicName: boat.name || boat.publicName,
          globalId: boat.globalId,
          vesselId: boat.vesselId,
          model: boat.model,
          lengthInMeters: boat.lengthInMeters,
          widthInMeters: boat.widthInMeters,
          draftInMeters: boat.draftInMeters,
          handicap: boat.handicap,
          source,
        },
        mainDatabaseTransaction,
      );

      const participantResult = await vesselParticipant.upsert(
        null,
        {
          vesselId: currentVessel.id,
          vesselParticipantGroupId: vesselGroup.id,
          handicap: boat.handicap,
        },
        mainDatabaseTransaction,
      );
      vesselParticipantsMap.set(
        participantResult.vesselId,
        participantResult.id,
      );
      if (boat.crews) {
        vesselParticipantToParticipantsMap.set(
          participantResult.id,
          boat.crews,
        );
      }
    }

    rankings = rankings?.map((t) => {
      const vesselId = existingVesselIdMap.get(t.id) || t.id; // replace vessel id if already exist
      const vesselParticipantId = vesselParticipantsMap.get(vesselId);
      return {
        vesselParticipantId: vesselParticipantId,
        elapsedTime: t.elapsedTime,
        finishTime: t.finishTime,
      };
    });

    console.log(`Save Participants and Crew`);
    for (const vesselParticipantId of vesselParticipantToParticipantsMap.keys()) {
      const participants =
        vesselParticipantToParticipantsMap.get(vesselParticipantId);
      const participantIds = [];
      for (const p of participants) {
        const addedParticipant = await participant.upsert(p.id, {
          ...p,
          calendarEventId: newCalendarEvent.id,
        });
        participantIds.push(addedParticipant.id);
      }
      if (participantIds.length) {
        await vesselParticipant.addParticipant({
          vesselParticipantId,
          participantIds,
        });
      }
    }

    console.log(`Creating new Course`);
    // add default value in case there is no point or mark
    if (courseSequencedGeometries.length === 0) {
      courseSequencedGeometries.push(
        ...[
          {
            geometryType: 'Point',
            order: 0,
            coordinates: [
              {
                position: approxStartPoint.coordinates,
              },
            ],
            properties: {
              name: 'Start Point',
            },
          },
          {
            geometryType: 'Point',
            order: 1,
            coordinates: [
              {
                position: approxEndPoint.coordinates,
              },
            ],
            properties: {
              name: 'End Point',
            },
          },
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

    await mainDatabaseTransaction.commit();

    // Create the participant track
    const vesselParticipantTracks = {};
    for (const currentParticipant of vesselParticipantsMap.values()) {
      vesselParticipantTracks[currentParticipant] = new VesselParticipantTrack(
        currentParticipant,
      );
    }
    for (const position of positions) {
      const vesselId =
        existingVesselIdMap.get(position.vesselId) || position.vesselId; // replace vessel id if already exist
      const tracker =
        vesselParticipantTracks[vesselParticipantsMap.get(vesselId)];
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
    console.log(`Finish saving competition unit ${raceId} into main database`);
  } catch (err) {
    console.log(
      `Error during saving competition unit ${raceId} into main database`,
      err,
    );
    await mainDatabaseTransaction.rollback();
  }
};

exports.saveCompetitionUnit = saveCompetitionUnit;
