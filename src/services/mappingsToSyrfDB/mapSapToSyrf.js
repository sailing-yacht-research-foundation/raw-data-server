const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');
const {
  vesselEvents,
  geometryType,
  boatSides,
} = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');

const mapAndSave = async (
  race,
  boats,
  positions,
  marks,
  markPositions,
  markPassings,
  competitors,
  courses,
  raceMetadata,
) => {
  console.log('Saving to main database');
  const event = {
    id: race.id,
    original_id: race.regatta,
    name: race.regatta,
    approxStartTimeMs: race.start_of_race_ms,
    approxEndTimeMs: race.end_of_race_ms,
  };

  const competitorToBoatMap = _mapCompetitorToBoat(positions, competitors);

  const inputBoats = _mapBoats(boats, competitorToBoatMap);

  const inputPositions = _mapPositions(positions);

  const { courseSequencedGeometries, markTrackers } = _mapSequencedGeometries(
    marks,
    courses,
    markPositions,
  );

  const passingEvents = _mapPassings(markPassings, courseSequencedGeometries);
  try {
    await saveCompetitionUnit({
      race: race,
      event,
      boats: inputBoats,
      positions: inputPositions,
      courseSequencedGeometries,
      markTrackers,
      markTrackerPositions: markPositions.map((pos) => ({
        timestamp: pos.timepoint_ms,
        lat: pos.lat_deg,
        lon: pos.lng_deg,
        markTrackerId: pos.mark_id,
      })),
      vesselParticipantEvents: passingEvents,
      raceMetadata,
      reuse: {
        boat: true,
        event: true,
      },
    });
    await saveToAwsElasticSearch(race, inputBoats, raceMetadata, event);
  } catch (e) {
    console.log(e);
  }
};

const _mapBoats = (boats, competitors) => {
  return boats.map((b) => {
    const competitor = competitors.find(
      (c) => c.boat_original_id === b.original_id,
    );
    const vessel = {
      id: b.id,
      vesselId: b.original_id,
      model: b.boat_class_name,
      publicName: competitor?.name || b.name || b.short_name,
      globalId: b.sail_number,
      lengthInMeters: b.boat_class_hull_length_in_meters,
    };
    if (competitor) {
      vessel.crews = competitor.sailors.map((s) => {
        return {
          publicName: s.name,
        };
      });
    }
    return vessel;
  });
};

const _mapPositions = (positions) => {
  return positions.map((p) => ({
    timestamp: p.timestamp,
    lon: p.lng_deg,
    lat: p.lat_deg,
    cog: p.truebearing_deg,
    sog: p.speed_kts,
    vesselId: p.competitor_boat_id,
  }));
};

const _mapSequencedGeometries = (marks, courses, marksPositions) => {
  const courseSequencedGeometries = [];
  const markTrackers = [];

  courses.forEach((c, index) => {
    if (c.class === 'ControlPointWithTwoMarks') {
      let portMarkId = c.startLinePortMarkId; // startLine is a new attribute on website data (not available on old files)
      let starboardMarkId = c.startLineStarboardMarkId;
      if (!portMarkId || !starboardMarkId) {
        if (index === 0) {
          // For some reason the startline always has reversed side left=starboard right=port
          portMarkId = c.right_id;
          starboardMarkId = c.left_id;
        } else {
          portMarkId = c.left_id;
          starboardMarkId = c.right_id;
        }
      }
      const portSideMarkPos = marksPositions.find(
        (p) => portMarkId === p.mark_original_id,
      );
      const starboardSideMarkPos = marksPositions.find(
        (p) => starboardMarkId === p.mark_original_id,
      );

      const line = createGeometryLine(
        {
          lat: portSideMarkPos.lat_deg,
          lon: portSideMarkPos.lng_deg,
          markTrackerId: portSideMarkPos.mark_id,
          properties: {
            name: marks?.find((m) => m.id === portSideMarkPos.mark_id)?.name,
            side: boatSides.PORT,
            class: c.left_class,
            type: c.left_type,
          },
        },
        {
          lat: starboardSideMarkPos.lat_deg,
          lon: starboardSideMarkPos.lng_deg,
          markTrackerId: starboardSideMarkPos.mark_id,
          properties: {
            name: marks?.find((m) => m.id === starboardSideMarkPos.mark_id)
              ?.name,
            side: boatSides.STARBOARD,
            class: c.right_class,
            type: c.right_type,
          },
        },
        {
          name: c.course_name,
          courseObjectId: c.id,
        },
      );

      markTrackers.push({
        id: portSideMarkPos.mark_id,
        name: c.course_name,
      });
      markTrackers.push({
        id: starboardSideMarkPos.mark_id,
        name: c.course_name,
      });
      line.order = index;
      courseSequencedGeometries.push(line);
    } else {
      const markPos = marksPositions.find(
        (p) => c.markId === p.mark_original_id,
      );

      const mark = createGeometryPoint({
        lat: markPos.lat_deg,
        lon: markPos.lng_deg,
        markTrackerId: markPos.mark_id,
        properties: { name: c.course_name, courseObjectId: c.id },
      });

      markTrackers.push({
        id: markPos.mark_id,
        name: c.course_name,
      });
      mark.order = index;
      courseSequencedGeometries.push(mark);
    }
  });

  return {
    courseSequencedGeometries,
    markTrackers,
  };
};

const _mapPassings = (passings, geometry) => {
  return passings.map((p) => {
    const eventGeometry = geometry.find((g) => {
      return g.properties.name === p.waypoint_name;
    });

    if (!eventGeometry) {
      return null;
    }
    const eventType =
      eventGeometry.geometryType === geometryType.LINESTRING
        ? vesselEvents.insideCrossing
        : vesselEvents.rounding;
    return {
      competitionUnitId: p.race_id,
      vesselId: p.competitor_boat_id,
      markId: eventGeometry.properties.courseObjectId,
      eventType,
      eventTime: p.time_as_millis,
    };
  });
};

const _mapCompetitorToBoat = (positions, competitors) => {
  const competitorToBoatMap = [];
  competitors.map((c) => {
    const obj = positions.find((p) => {
      return c.original_id === p.competitor_original_id;
    });

    if (obj)
      competitorToBoatMap.push({
        ...c,
        boat_id: obj.competitor_boat_id,
        boat_original_id: obj.competitor_boat_original_id,
      });
  });

  return competitorToBoatMap;
};

const saveToAwsElasticSearch = async (race, boats, raceMetadata, event) => {
  const names = [];
  const models = [];
  const identifiers = [];

  boats.forEach((b) => {
    if (b.publicName) {
      names.push(b.publicName);
    }

    if (b.model && !models.includes(b.model)) {
      models.push(b.model);
    }

    if (b.id) {
      identifiers.push(b.id);
    }
  });

  const body = {
    id: race.id,
    name: raceMetadata.name,
    event: event.id,
    event_name: event.name,
    source: raceMetadata.source,
    url: raceMetadata.url,
    start_country: raceMetadata.start_country,
    start_city: raceMetadata.start_city,
    start_year: raceMetadata.start_year,
    start_month: raceMetadata.start_month,
    start_day: raceMetadata.start_day,
    approx_start_time_ms: raceMetadata.approx_start_time_ms,
    approx_end_time_ms: raceMetadata.approx_end_time_ms,
    approx_duration_ms: raceMetadata.approx_duration_ms,
    approx_start_point: raceMetadata.approx_start_point,
    approx_end_point: raceMetadata.approx_end_point,
    approx_mid_point: raceMetadata.approx_mid_point,
    bounding_box: raceMetadata.bounding_box,
    approx_area_sq_km: raceMetadata.approx_area_sq_km,
    approx_distance_km: raceMetadata.approx_distance_km,
    num_boats: raceMetadata.num_boats,
    avg_time_between_positions: raceMetadata.avg_time_between_positions,
    boat_models: models,
    boat_identifiers: identifiers,
    boat_names: names,
    handicap_rules: raceMetadata.handicap_rules,
    unstructured_text: [],
  };

  await elasticsearch.indexRace(race.id, body);
};

module.exports = mapAndSave;
