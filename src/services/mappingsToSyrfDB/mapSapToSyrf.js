const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');
const { vesselEvents, geometryType } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');
const { v4: uuidv4 } = require('uuid');

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
        boats: true,
      },
    });
    await saveToAwsElasticSearch(race, boats, raceMetadata);
  } catch (e) {
    console.log(e);
  }
};

const _mapBoats = (boats, competitors) => {
  return boats.map((b) => {
    const competitor = competitors.find((c) => c.boat_id === b.id);
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
        const id = uuidv4();
        return {
          id: id,
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
      const firstPos = marksPositions.find(
        (p) => c.left_id === p.mark_original_id,
      );
      const lastPos = marksPositions.find(
        (p) => c.right_id === p.mark_original_id,
      );

      const line = createGeometryLine(
        {
          lat: firstPos.lat_deg,
          lon: firstPos.lng_deg,
          markTrackerId: firstPos.mark_id,
        },
        {
          lat: lastPos.lat_deg,
          lon: lastPos.lng_deg,
          markTrackerId: lastPos.mark_id,
        },
        {
          name: c.course_name,
          courseObjectId: c.id,
          portPoint: 0,
          starboardPoint: 1,
        },
      );

      markTrackers.push({
        id: firstPos.mark_id,
        name: c.course_name,
      });
      markTrackers.push({
        id: lastPos.mark_id,
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

const saveToAwsElasticSearch = async (race, boats, raceMetadata) => {
  const names = [];
  const models = [];
  const identifiers = [];

  boats.forEach((b) => {
    if (b.name) {
      names.push(b.name);
    }

    if (b.boat_class_name) {
      models.push(b.class);
    }

    if (b.id) {
      identifiers.push(b.id);
    }
  });

  const body = {
    id: race.id,
    name: raceMetadata.name,
    event: raceMetadata.event,
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
