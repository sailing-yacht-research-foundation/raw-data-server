const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryPosition,
  createGeometry,
} = require('../../utils/gisUtils');
const { geometryType, vesselEvents } = require('../../syrf-schema/enums');

const mapAndSave = async (data, raceMetadatas) => {
  console.log('Saving to main database');
  // event
  const event = data.GeoracingEvent.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name || e.short_name,
      approxStartTimeMs: new Date(e.start_time)?.getTime(),
      approxEndTimeMs: new Date(e.end_time)?.getTime(),
    };
  })[0];

  for (const race of data.GeoracingRace) {
    const raceMetadata = raceMetadatas.find((m) => m.id === race.id);

    // vessels
    const raceActors = data.GeoracingActor.filter((a) => a.race === race.id);
    const inputBoats = _mapBoats(raceActors);

    // positions
    const raceActorPositions = [];
    const raceCourseElementPositions = [];
    data.GeoracingPosition.forEach((pos) => {
      if (pos.race === race.id) {
        if (pos.trackable_type?.toLowerCase() === 'actor') {
          raceActorPositions.push(pos);
        } else if (pos.trackable_type?.toLowerCase() === 'course_element') {
          raceCourseElementPositions.push(pos);
        }
      }
    });

    if (raceActorPositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const inputPositions = _mapPositions(raceActorPositions);

    // course
    const activeCourse = data.GeoracingCourse?.find(
      (c) => c.race === race.id && c.active.toString() === '1',
    );

    // geometries
    // In georacing, there are multiple courses per race but there can only be 1 active course
    let raceCourseObjects, raceCourseElements;
    if (!activeCourse) {
      raceCourseObjects = data.GeoracingCourseObject?.filter(
        (co) => co.race === race.id && co.course === activeCourse.id,
      );
      raceCourseElements = data.GeoracingCourseElement?.filter(
        (ce) => ce.race === race.id && ce.course === activeCourse.id,
      );
    }
    const raceLines = data.GeoracingLine?.filter(
      (ce) => ce.race === race.id,
    );

    const { courseSequencedGeometries, markTrackers } = _mapSequencedGeometries(
      raceCourseObjects,
      raceCourseElements,
      raceCourseElementPositions,
      raceLines,
    );

    // splittime (course events)
    const raceSplittimeOriginalIds = data.GeoracingSplittime?.filter(
      (st) => st.race === race.id,
    )?.map((st) => st.original_id);
    const raceSplittimeObjects = data.GeoracingSplittimeObject?.filter((sto) =>
      raceSplittimeOriginalIds?.includes(sto.splittime_original_id),
    );
    const inputCourseEvents = _mapSplittime(
      raceSplittimeObjects,
      courseSequencedGeometries,
      race.id,
    );

    const inputRace = {
      id: race.id,
      original_id: race.original_id,
      url: race.url,
      scrapedUrl: event.url,
    };
    await saveCompetitionUnit({
      event,
      race: inputRace,
      boats: inputBoats,
      positions: inputPositions,
      raceMetadata,
      course: activeCourse,
      courseSequencedGeometries,
      markTrackers,
      vesselParticipantEvents: inputCourseEvents,
      reuse: {
        event: true,
      },
    });
  }
};

const _mapBoats = (boats) => {
  return boats
    ?.map((b) => ({
      id: b.id,
      publicName: b.name,
      globalId: b.start_number,
      vesselId: b.original_id,
      model: b.model,
      lengthInMeters: b.size,
    }))
    .filter((b) => !b.name); // Exclude boats without name. They are not in the race
};

const _mapPositions = (positions) => {
  return positions?.map((p) => {
    if (p.lon && !isNaN(p.lon) && p.lat && !isNaN(p.lat)) {
      return {
        timestamp: p.timestamp,
        lon: p.lon,
        lat: p.lat,
        cog: p.h,
        sog: p.s,
        vesselId: p.trackable_id,
      }
    } else {
      return null;
    }
  }).filter(Boolean);
};

const _mapSequencedGeometries = (
  courseObjects = [],
  courseElements = [],
  courseElementPositions = [],
  lines = [], // lines are only present on player version 3
) => {
  const courseSequencedGeometries = [];
  const markTrackers = [];
  for (const co of courseObjects) {
    switch (co.type?.toLowerCase()) {
      case 'mark': {
        const courseElement = courseElements?.find(
          (ce) => ce.course_object === co.id,
        );
        if (courseElement) {
          _addMarkTrackers(courseElement, courseElementPositions, markTrackers);

          const geometryMark = createGeometryPoint({
            lat: courseElement.latitude,
            lon: courseElement.longitude,
            markTrackerId:
              courseElement.course_element_type === 'tracked'
                ? courseElement.id
                : undefined,
            properties: {
              name: co.name,
              courseObjectId: co.original_id,
            },
          });
          geometryMark.id = co.id;
          geometryMark.order = co.order;
          courseSequencedGeometries.push(geometryMark);
        }
        break;
      }
      case 'gate': // Intended without break
      case 'zone': {
        const courseElementPoints = courseElements.filter(
          (ce) => ce.course_object === co.id,
        );
        if (courseElementPoints?.length) {
          const type =
            co.type?.toLowerCase() === 'gate'
              ? geometryType.LINESTRING
              : geometryType.POLYGON;
          const coordinates = [];

          courseElementPoints.forEach((courseElementPoint) => {
            _addMarkTrackers(
              courseElementPoint,
              courseElementPositions,
              markTrackers,
            );
            coordinates.push(
              createGeometryPosition({
                lat: courseElementPoint.latitude,
                lon: courseElementPoint.longitude,
                markTrackerId:
                  courseElementPoint.course_element_type === 'tracked'
                    ? courseElementPoint.id
                    : undefined,
              }),
            );
          });
          courseSequencedGeometries.push({
            ...createGeometry(
              coordinates,
              {
                name: co.name,
                courseObjectId: co.original_id,
              },
              type,
            ),
            id: co.id,
            order: co.order,
          });
        }
        break;
      }
    } // switch close
  }

  let lineOrder = 0;
  // type 0 are land mass and equator lines.
  const importantLines = lines.filter((l) => l.type?.toString() !== '0')
  for (const line of importantLines) {
    const points = line.points?.split(/\r\n| |\n/); // split with space or next line
    const coordinates = [];
    points?.forEach((p) => {
      const pArr = p.split(/;|,/);
      if (pArr.length >= 2 && !isNaN(pArr[0]) && !isNaN(pArr[1])) {
        coordinates.push(
          createGeometryPosition({
            lon: parseFloat(pArr[0]),
            lat: parseFloat(pArr[1]),
          }),
        );
      }
    });

    const type =
      coordinates.length > 2 && line.close?.toString() !== 'false' ? geometryType.POLYGON : geometryType.LINESTRING;
    courseSequencedGeometries.push({
      ...createGeometry(
        coordinates,
        {
          name: line.name,
          lineOriginalId: line.original_id,
        },
        type,
      ),
      id: line.id,
      order: lineOrder,
    });
    lineOrder++;
  }

  return { courseSequencedGeometries, markTrackers };
};

const _mapSplittime = (splittimeObjects, courseSequencedGeometries, raceId) => {
  return splittimeObjects
    ?.map((sto) => {
      const eventGeometry = courseSequencedGeometries?.find(
        (g) =>
          g.properties?.courseObjectId?.toString() ===
          sto.splittime_original_id?.toString(),
      );
      if (!eventGeometry) {
        return null;
      }
      const eventType =
        eventGeometry.geometryType === geometryType.LINESTRING
          ? vesselEvents.insideCrossing
          : vesselEvents.rounding;
      return {
        competitionUnitId: raceId,
        vesselId: sto.actor,
        markId: eventGeometry.id,
        eventType,
        eventTime: sto.time,
      };
    })
    .filter(Boolean);
};

const _findCourseElementFirstPosition = (
  courseElementPositions,
  courseElementOriginalId,
) => {
  return courseElementPositions?.find(
    (cep) =>
      cep.trackable_original_id.toString() ===
      courseElementOriginalId.toString(),
  );
};

const _addMarkTrackers = (
  courseElement,
  courseElementPositions,
  markTrackers,
) => {
  if (courseElement.course_element_type === 'tracked') {
    if (!courseElement.longitude || !courseElement.latitude) {
      const firstPos = _findCourseElementFirstPosition(
        courseElementPositions,
        courseElement.original_id,
      );
      courseElement.longitude = firstPos?.lon;
      courseElement.latitude = firstPos?.lat;
    }
    markTrackers.push({
      id: courseElement.id,
      name: courseElement.name,
    });
  }
};

module.exports = mapAndSave;
