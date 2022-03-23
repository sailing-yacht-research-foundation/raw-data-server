const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const { vesselEvents, geometryType } = require('../../syrf-schema/enums');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');

  const event = {
    id: data.race.id,
    original_id: data.race.event_name,
    name: data.race.event_name,
    approxStartTimeMs: raceMetadata.approx_start_time_ms,
    approxEndTimeMs: raceMetadata.approx_end_time_ms,
  };

  const mappedBoats = _mapBoats(data.boats);

  const mappedPositions = _mapPositions(
    data.boatPositions,
    raceMetadata.approx_start_time_ms,
  );

  const { courseSequencedGeometries, markTrackers } = _mapSequencedGeometries(
    data.buoys,
  );

  const passingEvents = _mapPassings(
    data.buoys.roundingTimes,
    courseSequencedGeometries,
    raceMetadata.approx_start_time_ms,
  );

  const rankings = _mapRankings(
    data.ranking,
    raceMetadata.approx_start_time_ms,
  );

  await saveCompetitionUnit({
    race: data.race,
    event,
    boats: mappedBoats,
    positions: mappedPositions,
    courseSequencedGeometries,
    markTrackers,
    markTrackerPositions: data.buoys.buoyPositions.map((pos) => ({
      timestamp: parseInt(
        pos.coordinate_interpolator_lat_time +
          Number(raceMetadata.approx_start_time_ms),
      ),
      lat: pos.coordinate_interpolator_lat,
      lon: pos.coordinate_interpolator_lon,
      markTrackerId: data.buoys.buoys.find((b) => b.original_id === pos.mark_id)
        .id,
    })),
    vesselParticipantEvents: passingEvents,
    rankings,
    raceMetadata,
    reuse: {
      boats: true,
      event: true,
    },
  });
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
        (p.coordinate_interpolator_lat_time + Number(startTime)) * 1000,
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
      eventTime: parseInt(p.time + Number(startTime)),
    };
  });
};

const _mapRankings = (rankings, startTime) => {
  return rankings?.map((r) => {
    const finishTime = parseInt(r.rank_interpolator_time + Number(startTime));
    return {
      vesselId: r.boat_id,
      finishTime,
      elapsedTime: finishTime - startTime,
    };
  });
};

module.exports = mapAndSave;
