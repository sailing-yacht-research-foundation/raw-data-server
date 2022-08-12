const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');
const { getHullsCount } = require('../../utils/utils');
const { boatSides } = require('../../syrf-schema/enums');

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
    const eventDescription = data.KwindooRunningGroup?.reduce((acc, rg) => {
      if (rg.regatta === e.id && rg.name.trim()) {
        acc.push(rg.name.trim());
      }
      return acc;
    }, [])?.join(', ');
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      description: eventDescription,
      approxStartTimeMs: new Date(e.first_start_time + '+0')?.getTime(),
      approxEndTimeMs: new Date(e.last_end_time + '+0')?.getTime(),
      url: `https://www.kwindoo.com/tracking/${e.original_id}-${e.name_slug}`,
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

    let raceDescription;
    try {
      const raceRunningGroupIds = JSON.parse(race.running_group_ids);
      raceDescription = data.KwindooRunningGroup?.reduce((acc, rg) => {
        if (raceRunningGroupIds.includes(rg.original_id) && rg.name.trim()) {
          acc.push(rg.name.trim());
        }
        return acc;
      }, [])?.join(', ');
    } catch (e) {
      console.log('Invalid race running group ids', e);
    }

    const inputRace = {
      id: race.id,
      original_id: race.original_id,
      name: race.name,
      description: raceDescription,
      url: race.url,
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
      competitionUnitData: {
        handicap: data.KwindooRunningGroup
          ? [
              ...data.KwindooRunningGroup.reduce((acc, h) => {
                if (['ORC', 'PHRF'].includes(h.name)) {
                  acc.add(h.name);
                }
                return acc;
              }, new Set()),
            ]
          : null,
      },
    });
    savedCompetitionUnits.push(cu);
  }
  return savedCompetitionUnits;
};

const _mapBoats = (boats) => {
  return boats?.map((b) => {
    const fullName = [b.first_name, b.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    const vessel = {
      id: b.id,
      publicName: b.boat_name || fullName || b.helmsman,
      globalId: b.sail_number || b.registry_number,
      sailNumber: b.sail_number || b.registry_number,
      vesselId: b.original_id,
      model: b.boat_type_alias,
      handicap: b.handycap ? { handicap: b.handycap } : null,
      isCommittee: b.not_racer?.toString() === '1',
      onboardEmail: b.email,
      homeport: b.homeport,
      hullsCount: getHullsCount(b.boat_type_alias),
    };

    // Boat Crew
    const crewName = b.helmsman || fullName;
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
        heading: p.b,
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
            side:
              waypoint.pass_direction === 'left'
                ? boatSides.PORT
                : boatSides.STARBOARD,
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
            properties: {
              name: waypoint.primary_marker_name,
              side: _getGeometryPrimaryMarkerSide(waypoint),
              approach_radius: waypoint.primary_marker_approach_radius,
              marker_id: waypoint.primary_marker_id,
            },
          },
          {
            lat: waypoint.secondary_marker_lat,
            lon: waypoint.secondary_marker_lon,
            properties: {
              name: waypoint.secondary_marker_name,
              side:
                _getGeometryPrimaryMarkerSide(waypoint) === boatSides.STARBOARD
                  ? boatSides.PORT
                  : boatSides.STARBOARD,
              approach_radius: waypoint.secondary_marker_approach_radius,
              marker_id: waypoint.secondary_marker_id,
            },
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

const _getGeometryPrimaryMarkerSide = (waypoint) => {
  // This function returns the correct side of the primary marker. Should reverse the value for secondary marker
  // The pass direction follows which side of the marker (whichever marker is on the left most when plotted on the map)
  // For example a geometry with primary B and secondary A with pass_direction of right. This means the boat needs to pass on the right side of A
  /*         B
            /
           / <=
          /
         A
  */
  // For example a geometry with primary B and secondary A with pass_direction of right. This means the boat needs to pass on the right side of B
  /*       B
            \
          => \
              \
               A
  */
  const isPrimaryRef =
    +waypoint.primary_marker_lon < +waypoint.secondary_marker_lon;
  if (
    (isPrimaryRef && waypoint.pass_direction === 'left') ||
    (!isPrimaryRef && waypoint.pass_direction === 'right')
  ) {
    return boatSides.STARBOARD;
  } else {
    return boatSides.PORT;
  }
};

module.exports = mapAndSave;
