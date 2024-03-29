const { createTransaction } = require('../syrf-schema/utils/utils');
const failedUrlDataAccess = require('../syrf-schema/dataAccess/v1/scrapedFailedUrl');
const successfulUrlDataAccess = require('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const { participantInvitationStatus } = require('../syrf-schema/enums');
const calendarEvent = require('../syrfDataServices/v1/calendarEvent');
const competitionUnit = require('../syrfDataServices/v1/competitionUnit');
const vessel = require('../syrfDataServices/v1/vessel');
const vesselParticipant = require('../syrfDataServices/v1/vesselParticipant');
const vesselParticipantGroup = require('../syrfDataServices/v1/vesselParticipantGroup');
const vesselParticipantEvent = require('../syrfDataServices/v1/vesselParticipantEvent');
const courses = require('../syrfDataServices/v1/courses');
const participant = require('../syrfDataServices/v1/participant');
const VesselParticipantTrack = require('../syrfDataServices/v1/vesselParticipantTrack');
const PointTrack = require('../syrfDataServices/v1/pointTrack');
const markTracker = require('../syrfDataServices/v1/markTracker');
const ogJob = require('../jobs/openGraph');

const saveCompetitionUnit = async ({
  event,
  race,
  boats,
  positions,
  rankings,
  raceMetadata,
  course,
  courseSequencedGeometries = [],
  handicapMap = {},
  reuse = {},
  markTrackers = [],
  markTrackerPositions = [],
  vesselParticipantEvents = [],
  competitionUnitData = {},
}) => {
  let {
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
    if (typeof approxStartTimeMs === 'string') {
      approxStartTimeMs = parseFloat(approxStartTimeMs);
    }
    if (typeof approxEndTimeMs === 'string') {
      approxEndTimeMs = parseFloat(approxEndTimeMs);
    }
    console.log('Create new calendar event');
    // 1. Save calendar event information
    let existingEvent;
    if ((reuse.event || reuse.events) && event?.original_id) {
      existingEvent = await calendarEvent.getByScrapedOriginalIdAndSource(
        event.original_id.toString(),
        source,
      );
      if (existingEvent?.length) {
        event.id = existingEvent[0].id;
      }
    }
    const existingStartTime = existingEvent?.[0]?.approximateStartTime;
    let approximateStartTime = parseFloat(event?.approxStartTimeMs);
    if (!approximateStartTime) {
      // If reused, retain existing event start time if it is before the race start time since event time range is for all races within
      if (existingStartTime && existingStartTime < approxStartTimeMs) {
        approximateStartTime = existingStartTime;
      } else {
        approximateStartTime = approxStartTimeMs;
      }
    }

    const existingEndTime = existingEvent?.[0]?.approximateEndTime;
    let approximateEndTime = parseFloat(event?.approxEndTimeMs);
    if (!approximateEndTime) {
      // If reused, retain existing event end time if it is after the race end time since event time range is for all races within
      if (existingEndTime && existingEndTime > approxEndTimeMs) {
        approximateEndTime = existingEndTime;
      } else {
        approximateEndTime = approxEndTimeMs;
      }
    }
    const newCalendarEvent = await calendarEvent.upsert(
      event?.id,
      {
        name: event?.name,
        description: event?.description,
        locationName: event?.locationName,
        externalUrl: event?.url,
        approximateStartTime,
        approximateEndTime,
        lat: event?.lat || lat,
        lon: event?.lon || lon,
        source,
        country: event?.country || country,
        city: event?.city || city,
        openGraphImage,
        scrapedOriginalId: event?.original_id,
        isPrivate: event?.isPrivate, // used to hide scraped race playback (forced iframe) like kattack races (not feed races) since there are issues
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
    let existingVessels;
    if (reuse.boat || reuse.boats) {
      existingVessels = await vessel.getByVesselIdAndSource(
        boats.map((b) => b.vesselId?.toString()),
        source,
      );
    }
    for (const boat of boats) {
      if (reuse.boat || reuse.boats) {
        // some scrapers have the same boat.original_id but different info like yellowbrick
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
      }
      vesselsToSave.push({
        id: boat.id,
        publicName: boat.name || boat.publicName,
        globalId: boat.globalId,
        sailNumber: boat.sailNumber,
        vesselId: boat.vesselId,
        model: boat.model,
        mmsi: boat.mmsi,
        lengthInMeters: boat.lengthInMeters,
        widthInMeters: boat.widthInMeters,
        draftInMeters: boat.draftInMeters,
        handicap: boat.handicap,
        deckColor: boat.deckColor,
        hullsCount: boat.hullsCount,
        hullColorAboveWaterline: boat.hullColorAboveWaterline,
        hullColorBelowWaterline: boat.hullColorBelowWaterline,
        homeport: boat.homeport,
        onboardEmail: boat.onboardEmail,
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
        sailNumber: boat.sailNumber,
        isCommittee: boat.isCommittee,
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

    rankings = rankings
      ?.map((t) => {
        const vesselId = existingVesselIdMap.get(t.vesselId) || t.vesselId; // replace vessel id if already exist
        const vesselParticipantId = createdVesselParticipants.find(
          (vp) => vp.vesselId === vesselId,
        )?.id;
        if (vesselParticipantId) {
          return {
            vesselParticipantId: vesselParticipantId,
            elapsedTime: t.elapsedTime,
            finishTime: t.finishTime,
          };
        } else {
          return null;
        }
      })
      .filter(Boolean);

    console.log(`Save Participants and Crew`);
    for (const vesselId of vesselsToParticipantsMap.keys()) {
      const participants = vesselsToParticipantsMap.get(vesselId);
      const vesselParticipantId = createdVesselParticipants.find(
        (vp) => vp.vesselId === vesselId,
      )?.id;
      const addedParticipants = await participant.bulkCreate(
        participants.map((p) => ({
          ...p,
          invitationStatus: participantInvitationStatus.SELF_REGISTERED,
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

    for (const tracker of markTrackers) {
      await markTracker.upsert(
        tracker.id,
        { name: tracker.name, calendarEventId: newCalendarEvent.id },
        mainDatabaseTransaction,
      );
    }
    const [createdCourse, courseSequencedGeometriesPoints] =
      await courses.upsert(
        null,
        {
          calendarEventId: newCalendarEvent.id,
          name: course?.name || name,
          courseSequencedGeometries,
        },
        mainDatabaseTransaction,
      );

    console.log(`Create new Competition Unit`);
    // Save competition unit information
    const newCompetitionUnit = await competitionUnit.upsert(
      raceId,
      {
        name: race.name || name,
        description: race.description,
        approximateStartLocation: approxStartPoint,
        approximateEndLocation: approxEndPoint,
        startTime: approxStartTimeMs,
        approximateStart: approxStartTimeMs,
        boundingBox,
        vesselParticipantGroupId: vesselGroup.id,
        courseId: createdCourse.id,
        calendarEventId: newCalendarEvent.id,
        endTime: approxEndTimeMs,
        country,
        city,
        openGraphImage,
        scrapedOriginalId: race.original_id,
        scrapedUrl: race.url,
        ...competitionUnitData,
      },
      mainDatabaseTransaction,
    );

    const pointTracks = {};
    if (markTrackers.length) {
      const realTimePoints = courseSequencedGeometriesPoints.filter(
        (t) => t.markTrackerId,
      );

      const trackerToPointMap = {};
      for (const point of realTimePoints) {
        if (trackerToPointMap[point.markTrackerId]) {
          // This is when a geometry is using the same mark tracker. Like 2 geometry line in 3 points
          trackerToPointMap[point.markTrackerId] = []
            .concat(trackerToPointMap[point.markTrackerId])
            .concat(point.id);
        } else {
          trackerToPointMap[point.markTrackerId] = point.id;
        }
        pointTracks[point.id] = new PointTrack(point.id);
      }

      for (const pointPosition of markTrackerPositions) {
        if (!pointPosition.markTrackerId) {
          continue;
        }
        const pointId = trackerToPointMap[pointPosition.markTrackerId];
        if (!pointId) {
          continue;
        }
        if (
          pointPosition.lon === null ||
          pointPosition.lat === null ||
          pointPosition.timestamp === null ||
          isNaN(pointPosition.lon) ||
          isNaN(pointPosition.lat) ||
          isNaN(pointPosition.timestamp)
        ) {
          console.log(
            `Error: Lon (${pointPosition.lon}) or lat (${pointPosition.lat}) or timestamp (${pointPosition.timestamp}) is not a valid float/int`,
          );
          continue;
        }
        if (pointId instanceof Array) {
          pointId.forEach((pId) => {
            pointTracks[pId].addNewPosition(
              [+pointPosition.lon, +pointPosition.lat],
              +pointPosition.timestamp,
            );
          });
        } else {
          pointTracks[pointId].addNewPosition(
            [+pointPosition.lon, +pointPosition.lat],
            +pointPosition.timestamp,
          );
        }
      }
    }
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

      if (
        position.lon === null ||
        position.lat === null ||
        position.timestamp === null ||
        isNaN(position.lon) ||
        isNaN(position.lat) ||
        isNaN(position.timestamp)
      ) {
        console.log(
          `Error: Lon (${position.lon}) or lat (${position.lat}) or timestamp (${position.timestamp}) is not a valid float/int`,
        );
        continue;
      }

      tracker?.addNewPosition(
        [+position.lon, +position.lat],
        +position.timestamp,
        position,
      );
    }

    // Remove vessel participant track that does not have positions
    for (const vesselParticipantId in vesselParticipantTracks) {
      const track = vesselParticipantTracks[vesselParticipantId];
      if (!track.positions?.length) {
        delete vesselParticipantTracks[vesselParticipantId];
      }
    }

    // vesselParticipantEvents
    if (vesselParticipantEvents.length) {
      await vesselParticipantEvent.bulkCreate(
        vesselParticipantEvents
          .map((e) => {
            const vesselId = existingVesselIdMap.get(e.vesselId) || e.vesselId; // replace vessel id if already exist
            const vesselParticipantId = createdVesselParticipants.find(
              (vp) => vp.vesselId === vesselId,
            )?.id;
            if (
              vesselParticipantId &&
              e.competitionUnitId &&
              e.markId &&
              e.eventType &&
              e.eventTime
            ) {
              return {
                vesselParticipantId,
                competitionUnitId: e.competitionUnitId,
                markId: e.markId,
                eventType: e.eventType,
                eventTime: e.eventTime,
              };
            } else {
              return null;
            }
          })
          .filter(Boolean),
        mainDatabaseTransaction,
      );
    }

    await competitionUnit.stopCompetition(
      newCompetitionUnit.id,
      vesselParticipantTracks,
      pointTracks,
      rankings,
    );

    await successfulUrlDataAccess.create(
      {
        url: race.scrapedUrl || race.url || url,
        originalId: race.original_id.toString(),
        source,
        createdAt: Date.now(),
      },
      mainDatabaseTransaction,
    );

    await mainDatabaseTransaction.commit();
    console.log(`Finish saving competition unit ${raceId} into main database`);

    if (!existingEvent?.length) {
      try {
        ogJob.addEvent(
          {
            id: newCalendarEvent.id,
            position: newCalendarEvent.location.coordinates,
          },
          { jobId: newCalendarEvent.id },
        );
      } catch (err) {
        console.log(
          `Adding event (with id ${newCalendarEvent.id}) opengraph job failed`,
          err,
        );
      }
    }
    try {
      ogJob.addCompetitionUnit(
        {
          idList: [newCompetitionUnit.id],
          position: newCompetitionUnit.approximateStartLocation.coordinates,
        },
        { jobId: newCompetitionUnit.id },
      );
    } catch (err) {
      console.log(
        `Adding competition unit (with id ${newCompetitionUnit.id}) opengraph job failed`,
        err,
      );
    }
    return newCompetitionUnit;
  } catch (err) {
    console.log(
      `Error during saving competition unit ${raceId} into main database`,
      err,
    );
    await mainDatabaseTransaction.rollback();

    if (err.toString().indexOf('Operation timeout') < 0) {
      // Only register if not timeout so it can be retried
      await failedUrlDataAccess.create({
        url: race.scrapedUrl || race.url || url,
        error: err.toString(),
        source,
        createdAt: Date.now(),
      });
    }
  }
};

exports.saveCompetitionUnit = saveCompetitionUnit;
