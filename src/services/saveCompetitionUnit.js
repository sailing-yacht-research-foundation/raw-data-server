const { createTransaction } = require('../syrf-schema/utils/utils');
const calendarEvent = require('../syrfDataServices/v1/calendarEvent');
const competitionUnit = require('../syrfDataServices/v1/competitionUnit');
const vessel = require('../syrfDataServices/v1/vessel');
const vesselParticipant = require('../syrfDataServices/v1/vesselParticipant');
const vesselParticipantGroup = require('../syrfDataServices/v1/vesselParticipantGroup');
const courses = require('../syrfDataServices/v1/courses');
const VesselParticipantTrack = require('../syrfDataServices/v1/vesselParticipantTrack');

/*
{
    id,
    name,
    event,
    source,
    url,
    start_country: startCountry,
    start_city: startCity,
    start_year: startYear,
    start_month: startMonth,
    start_day: startDay,
    approx_start_time_ms: approxStartTimeMs,
    approx_end_time_ms: approxEndTimeMs,
    approx_duration_ms: approxDurationMs,
    approx_start_point: approxStartPoint,
    approx_start_lat: approxStartLat,
    approx_start_lon: approxStartLon,
    approx_end_point: approxEndPoint,
    approx_end_lat: approxEndLat,
    approx_end_lon: approxEndLon,
    approx_mid_point: approxMidPoint,
    bounding_box: boundingBox,
    approx_area_sq_km: approxAreaSqKm,
    approx_distance_km: approxDistanceKm,
    num_boats: numBoats,
    avg_time_between_positions: avgTimeBetweenPositions,
    boat_models: boatModels,
    handicap_rules: handicapRulesFiltered,
    great_circle: greatCircle,
    open_graph_image: openGraphImage,
  }
*/
const saveCompetitionUnit = async (
  boats,
  allPositions,
  rankings,
  event,
  {
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
  },
  { courseSequencedGeometries = [] } = {},
) => {
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

    console.log('Create new vessels');
    // Save vessels information
    let vessels = [];
    // TODO: get existing vessel information to reuse
    // in case there is no existing vessels, then create new one

    const vesselOriginalIdMap = new Map();
    for (const boat of boats) {
      const currentVessel = await vessel.upsert(
        boat.id,
        {
          publicName: boat.name,
          vesselId: boat.vesselId,
          lengthInMeters: boat.lengthInMeters,
        },
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

    rankings = rankings.map((t) => {
      const vesselParticipantId = vesselParticipants.get(t.id);
      return {
        vesselParticipantId: vesselParticipantId,
        elapsedTime: t.elapsedTime,
        finishTime: t.finishTime,
      };
    });

    console.log(`Creating new Course`);

    const newCourseSequencedGeometries = [];
    if (boundingBox) {
      newCourseSequencedGeometries.push({
        geometryType: 'Polygon',
        order: 0,
        coordinates: boundingBox.coordinates[0].map((t) => {
          return { position: t };
        }),
      });
    }
    if (courseSequencedGeometries) {
      for (let i = 0; i < courseSequencedGeometries.length; i++) {
        newCourseSequencedGeometries.push({
          ...courseSequencedGeometries[i],
          order: i + newCourseSequencedGeometries.length,
        });
      }
    }
    const createdCourse = await courses.upsert(
      null,
      {
        calendarEventId: newCalendarEvent.id,
        name,
        // something like bounding box
        courseSequencedGeometries: newCourseSequencedGeometries,
        // course related geometries (start line, gates, finish line etc)
        courseUnsequencedUntimedGeometry: [
          {
            geometryType: 'Point',
            order: 0,
            coordinates: [
              {
                position: approxStartPoint.coordinates,
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
                position: approxEndPoint.coordinates,
                properties: {
                  name: 'End Point',
                },
              },
            ],
          },
        ],
        courseUnsequencedTimedGeometry: [], // no used atm
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
      },
      mainDatabaseTransaction,
    );

    mainDatabaseTransaction.commit();

    // Create the participant track
    const vesselParticipantTracks = {};
    for (const currentParticipant of vesselParticipants.values()) {
      vesselParticipantTracks[currentParticipant] = new VesselParticipantTrack(
        currentParticipant,
      );
    }
    for (const position of allPositions) {
      const tracker =
        vesselParticipantTracks[vesselParticipants.get(position.vesselId)];
      tracker.addNewPosition(
        [position.lon, position.lat],
        position.timestamp,
        {
          cog: position.cog,
        },
        {},
      );
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
    mainDatabaseTransaction.rollback();
  }
};

exports.saveCompetitionUnit = saveCompetitionUnit;
