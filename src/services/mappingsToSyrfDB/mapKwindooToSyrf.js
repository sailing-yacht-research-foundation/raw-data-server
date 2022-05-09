const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadatas) => {
  if (
    !raceMetadatas?.length ||
    !data.KwindooRegatta?.length ||
    !data.KwindooRace?.length ||
    !data.KwindooBoat?.length ||
    !data.KwindooPosition?.length
  ) {
    console.log('Missing data');
    console.log(
      `raceMetadatas?.length ${raceMetadatas?.length},
      data.KwindooRegatta?.length ${data.KwindooRegatta?.length},
      data.KwindooRace?.length ${data.KwindooRace?.length},
      data.KwindooBoat?.length ${data.KwindooBoat?.length},
      data.KwindooPosition?.length ${data.KwindooPosition?.length}`,
    );
    return;
  }
  console.log('Saving to main database');
  // event
  const event = data.KwindooRegatta.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      approxStartTimeMs: new Date(e.start_timestamp)?.getTime(),
      approxEndTimeMs: new Date(e.end_timestamp)?.getTime(),
    };
  })[0];

  const savedCompetitionUnits = [];
  for (const race of data.KwindooRace) {
    const raceMetadata = raceMetadatas?.find((m) => m.id === race.id);
    if (!raceMetadata) {
      console.log(`No race metadata found on race id ${race.id}`);
      continue;
    }

    // vessels
    const inputBoats = _mapBoats(
      data.KwindooBoat.filter((b) => b.race === race.id),
    );

    // positions
    const inputPositions = _mapPositions(
      data.KwindooPosition.filter((b) => b.race === race.id),
    );

    // geometries
    const courseSequencedGeometries = _mapSequencedGeometries(
      data.KwindooWaypoint?.filter((w) => w.race === race.id),
      data.KwindooMarker?.filter((w) => w.race === race.id),
    );

    const inputRace = {
      id: race.id,
      original_id: race.original_id,
      name: race.name,
      url: race.url,
      scrapedUrl: event.url,
    };
    const cu = await saveCompetitionUnit({
      event,
      race: inputRace,
      boats: inputBoats,
      positions: inputPositions,
      raceMetadata,
      courseSequencedGeometries,
      reuse: {
        event: true,
        boat: true,
      },
    });
    savedCompetitionUnits.push(cu);
  }
  return savedCompetitionUnits;
};

const _mapBoats = (boats) => {
  return boats?.map((b) => {
    const crewName = [b.first_name, b.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const vessel = {
      id: b.id,
      publicName: b.boat_name || crewName,
      globalId: b.sail_number,
      vesselId: b.original_id,
      model: b.boat_type_alias,
      handicap: b.handycap ? { handicap: b.handycap } : null,
      isCommittee: b.not_racer?.toString() === '1',
    };

    // Boat Crew
    if (crewName) {
      vessel.crews = [
        {
          publicName: crewName,
        },
      ];
    }

    return vessel;
  });
};

const _mapPositions = (positions) => {
  return positions
    ?.map((p) => {
      return {
        timestamp: +p.t * 1000,
        lon: +p.lon,
        lat: +p.lat,
        cog: p.b,
        sog: p.s,
        vesselId: p.boat,
      };
    })
    .filter(Boolean);
};

const _mapSequencedGeometries = (waypoints = [], markers = []) => {
  const courseSequencedGeometries = [];
  const excludeMarkersId = [];
  for (const waypoint of waypoints) {
    switch (waypoint.type) {
      case 'buoy': {
        const geometryMark = createGeometryPoint({
          lat: waypoint.primary_marker_lat,
          lon: waypoint.primary_marker_lon,
          properties: {
            name: waypoint.primary_marker_name,
            role: waypoint.role,
            diameter: waypoint.diameter,
            side: waypoint.pass_direction === 'left' ? 'port' : 'starboard',
            approach_radius: waypoint.primary_marker_approach_radius,
            marker_id: waypoint.primary_marker_id,
          },
        });
        geometryMark.id = waypoint.id;
        geometryMark.order = waypoint.order_number;
        courseSequencedGeometries.push(geometryMark);
        excludeMarkersId.push(waypoint.primary_marker_id);
        break;
      }
      case 'gate': {
        const geometryLine = createGeometryLine(
          {
            lat: waypoint.primary_marker_lat,
            lon: waypoint.primary_marker_lon,
          },
          {
            lat: waypoint.secondary_marker_lat,
            lon: waypoint.secondary_marker_lon,
          },
          {
            name: [
              ...new Set([
                waypoint.primary_marker_name,
                waypoint.secondary_marker_name,
              ]),
            ]
              .filter(Boolean)
              .join(' - '),
            role: waypoint.role,
            diameter: waypoint.diameter,
            side: waypoint.pass_direction === 'left' ? 'port' : 'starboard',
            primary_marker_approach_radius:
              waypoint.primary_marker_approach_radius,
            secondary_marker_approach_radius:
              waypoint.secondary_marker_approach_radius,
            primary_marker_id: waypoint.primary_marker_id,
            secondary_marker_id: waypoint.secondary_marker_id,
          },
        );
        geometryLine.id = waypoint.id;
        geometryLine.order = waypoint.order_number;
        courseSequencedGeometries.push(geometryLine);
        excludeMarkersId.push(waypoint.primary_marker_id);
        excludeMarkersId.push(waypoint.secondary_marker_id);
        break;
      }
    } // switch close
  }

  // Add markers that were not included in the waypoints
  let markerOrder = Math.max(courseSequencedGeometries.length - 1, 0); // exclude finish line
  for (const marker of markers.filter(
    (m) => !excludeMarkersId.includes(m.original_id),
  )) {
    const geometryMark = createGeometryPoint({
      lat: marker.lat,
      lon: marker.lon,
      properties: {
        name: marker.name,
        approach_radius: marker.approach_radius,
        marker_id: marker.original_id,
      },
    });
    geometryMark.id = marker.id;
    geometryMark.order = markerOrder++;
    courseSequencedGeometries.push(geometryMark);
  }
  return courseSequencedGeometries;
};

module.exports = mapAndSave;
