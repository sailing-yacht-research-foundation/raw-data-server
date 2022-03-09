const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const { vesselEvents, geometryType } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');

const mapAndSave = async (
  race,
  boats,
  positions,
  marks,
  markPositions,
  markPassings,
  raceMetadata,
) => {
  console.log('Saving to main database');
  const inputBoats = _mapBoats(boats);

  const inputPositions = _mapPositions(positions);

  const { courseSequencedGeometries, markTrackers } = _mapSequencedGeometries(
    marks,
    markPositions,
  );

  const passingEvents = _mapPassings(markPassings, courseSequencedGeometries);

  await saveToAwsElasticSearch(race, boats, raceMetadata);

  try {
    await saveCompetitionUnit({
      race: race,
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
  } catch (e) {
    console.log(e);
  }
};

const _mapBoats = (boats) => {
  return boats.map((b) => {
    const vessel = {
      id: b.id,
      vesselId: b.original_id,
      model: b.boat_class_name,
      publicName: b.name,
    };
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

const _mapSequencedGeometries = (marks, marksPositions) => {
  const courseSequencedGeometries = [];
  const markTrackers = [];
  let index = 0;

  //Start
  marks.forEach((m) => {
    if (m.name.includes('Start') || m.name.includes('Finish')) {
      if (m.name.includes('1')) {
        const firstPos = marksPositions.find((pos) => {
          return m.id == pos.mark_id;
        });

        const startPoint = createGeometryPoint({
          lat: firstPos.lat_deg,
          lon: firstPos.lng_deg,
          markTrackerId: firstPos.mark_id,
          properties: {
            name: m.name,
            courseObjectId: m.id,
          },
        });
        markTrackers.push({
          id: m.id,
          name: 'Start',
        });
        (startPoint.id = m.id), (startPoint.order = index++);
        courseSequencedGeometries.push(startPoint);
      }
    }
  });

  //Finish
  marks.forEach((m) => {
    if (m.name.includes('Start') || m.name.includes('Finish')) {
      if (m.name.includes('2')) {
        const endPos = marksPositions.find((pos) => {
          return m.id == pos.mark_id;
        });

        const endPoint = createGeometryPoint({
          lat: endPos.lat_deg,
          lon: endPos.lng_deg,
          markTrackerId: endPos.mark_id,
          properties: {
            name: m.name,
            courseObjectId: m.id,
          },
        });
        markTrackers.push({
          id: m.id,
          name: 'Finish',
        });
        (endPoint.id = m.id), (endPoint.order = marks.length - 1);
        courseSequencedGeometries.push(endPoint);
      }
    }
  });

  marks.forEach((m) => {
    if (!m.name.includes('Start') || !m.name.includes('Finish')) {
      const markPos = marksPositions.find((pos) => {
        return m.id == pos.mark_id;
      });

      const markPoint = createGeometryPoint({
        lat: markPos.lat_deg,
        lon: markPos.lng_deg,
        markTrackerId: markPos.mark_id,
        properties: {
          name: m.name,
          courseObjectId: m.id,
        },
      });
      markTrackers.push({
        id: m.id,
        name: m.name,
      });
      (markPoint.id = m.id), (markPoint.order = index++);
      courseSequencedGeometries.push(markPoint);
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
      return g.order === p.zero_based_waypoint_index;
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
      markId: eventGeometry.id,
      eventType,
      eventTime: p.time_as_millis,
    };
  });
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
