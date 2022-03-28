const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const { vesselEvents, geometryType } = require('../../syrf-schema/enums');
const s3Util = require('../s3Util');
const elasticsearch = require('../../utils/elasticsearch');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');

  const eventName = data.race.event_name.split(' ').join('_');
  const raceName = data.race.race_name.split(' ').join('_');
  const fileName = `2021-${eventName}-${raceName}.json`;

  const obj = JSON.parse(
    await s3Util.getObject(fileName, 'americas-cup-raw-data'),
  );
  const startTime = parseInt(
    (+obj.race.courseInfo.startTime + obj.race.raceStartTime) * 1000,
  );

  const endTime = parseInt(
    (data.race.max_race_time - data.race.min_race_time) * 1000 + startTime,
  );

  const event = {
    id: data.race.id,
    original_id: data.race.event_name,
    name: data.race.event_name,
    approxStartTimeMs: startTime,
    approxEndTimeMs: endTime,
  };
  raceMetadata.approx_start_time_ms = startTime;
  raceMetadata.approx_end_time_ms = endTime;
  raceMetadata.approx_duration_ms = endTime - startTime;

  const mappedBoats = _mapBoats(data.boats);

  const mappedPositions = _mapPositions(
    data.boatPositions,
    obj.race.courseInfo.startTime,
  );

  const { courseSequencedGeometries, markTrackers } = _mapSequencedGeometries(
    data.buoys,
  );

  const passingEvents = _mapPassings(
    data.buoys.roundingTimes,
    courseSequencedGeometries,
    obj.race.courseInfo.startTime,
  );

  const rankings = _mapRankings(data.ranking, obj.race.courseInfo.startTime);

  try {
    await saveCompetitionUnit({
      race: data.race,
      event,
      boats: mappedBoats,
      positions: mappedPositions,
      courseSequencedGeometries,
      markTrackers,
      markTrackerPositions: data.buoys.buoyPositions.map((pos) => ({
        timestamp: parseInt(
          (pos.coordinate_interpolator_lat_time +
            obj.race.courseInfo.startTime) *
            1000,
        ),
        lat: pos.coordinate_interpolator_lat,
        lon: pos.coordinate_interpolator_lon,
        markTrackerId: data.buoys.buoys.find(
          (b) => b.original_id === pos.mark_id,
        ).id,
      })),
      vesselParticipantEvents: passingEvents,
      rankings,
      raceMetadata,
      reuse: {
        boats: true,
        event: true,
      },
    });
    await saveToAwsElasticSearch(data.race, data.boats, raceMetadata);
  } catch (e) {
    console.log(e);
  }
};

const _mapBoats = ({ boats, teams }) => {
  return boats.map((b) => {
    const crew = teams.find((t) => b.team_original_id == t.original_id);

    const vessel = {
      id: b.id,
      original_id: b.original_id,
      publicName: crew.name || crew.abbreviation || '',
    };

    vessel.crews = [
      {
        publicName: crew.name || crew.abbreviation || '',
      },
    ];
    return vessel;
  });
};

const _mapPositions = (
  { boatPositions, boatTwds, boatTwss, boatVmgs },
  startTime,
) => {
  return boatPositions.map((p, i) => {
    return {
      timestamp: parseInt(
        (+startTime + p.coordinate_interpolator_lat_time) * 1000,
      ),
      lat: p.coordinate_interpolator_lat,
      lon: p.coordinate_interpolator_lon,
      vesselId: p.boat_id,
      cog: p.heading_interpolator_value,
      sog: p.speed_interpolator_value,
      windSpeed: boatTwss[i]?.tws_interpolator_value,
      windDirection: boatTwds[i]?.twd_interpolator_value,
      vmg: boatVmgs[i]?.vmg_interpolator_value,
    };
  });
};

const _mapSequencedGeometries = ({ buoys, buoyPositions }) => {
  const courseSequencedGeometries = [];
  const markTrackers = [];

  buoys.forEach((m, i) => {
    const markPos = buoyPositions.find((p) => m.original_id === p.mark_id);
    if (
      markPos.coordinate_interpolator_lat &&
      markPos.coordinate_interpolator_lon
    ) {
      const mark = createGeometryPoint({
        lat: markPos.coordinate_interpolator_lat,
        lon: markPos.coordinate_interpolator_lon,
        markTrackerId: m.id,
        properties: {
          courseObjectId: m.id,
        },
      });

      markTrackers.push({
        id: m.id,
      });

      mark.order = i;
      courseSequencedGeometries.push(mark);
    }
  });

  return {
    courseSequencedGeometries,
    markTrackers,
  };
};

const _mapPassings = (passings, geometry, startTime) => {
  return passings.map((p) => {
    const eventGeometry = geometry.find((g) => {
      return g.order === p.mark_number;
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
      vesselId: p.boat_id,
      markId: eventGeometry.properties.courseObjectId,
      eventType,
      eventTime: parseInt((p.time + startTime) * 1000),
    };
  });
};

const _mapRankings = (rankings, startTime) => {
  return rankings?.map((r) => {
    const finishTime = parseInt(r.rank_interpolator_time + startTime);
    return {
      vesselId: r.boat_id,
      finishTime,
      elapsedTime: finishTime - startTime,
    };
  });
};

const saveToAwsElasticSearch = async (race, boats, raceMetadata) => {
  const names = [];

  boats.teams.forEach((b) => {
    if (b.boat_name) {
      names.push(b.boat_name);
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
    start_year: Number(raceMetadata.start_year),
    start_month: Number(raceMetadata.start_month),
    start_day: Number(raceMetadata.start_day),
    approx_start_time_ms: Number(raceMetadata.approx_start_time_ms),
    approx_end_time_ms: Number(raceMetadata.approx_end_time_ms),
    approx_duration_ms: Number(raceMetadata.approx_duration_ms),
    approx_start_point: raceMetadata.approx_start_point,
    approx_end_point: raceMetadata.approx_end_point,
    approx_mid_point: raceMetadata.approx_mid_point,
    bounding_box: raceMetadata.bounding_box,
    approx_area_sq_km: raceMetadata.approx_area_sq_km,
    approx_distance_km: raceMetadata.approx_distance_km,
    num_boats: raceMetadata.num_boats,
    avg_time_between_positions: raceMetadata.avg_time_between_positions,
    boat_models: [],
    boat_identifiers: [],
    boat_names: names,
    handicap_rules: raceMetadata.handicap_rules,
    unstructured_text: [],
  };

  await elasticsearch.indexRace(race.id, body);
};
module.exports = mapAndSave;
