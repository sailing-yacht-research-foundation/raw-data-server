const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryPosition,
  createGeometry,
} = require('../../utils/gisUtils');
const { geometryType } = require('../../syrf-schema/enums');

const BOAT_TYPES = {
  Helicopter: 'Helicopter',
  Mark: 'Mark',
  Umpire: 'Umpire',
  RC: 'RC',
  Marshall: 'Marshall',
  ProApp: 'ProApp',
  Yacht: 'Yacht',
  ClientData: 'ClientData',
};

const mapAndSave = async (data, raceMetadatas) => {
  console.log('Saving to main database');
  const regattas = data.AmericasCupRegatta.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      lat: +e.central_lat,
      lon: +e.central_lon,
    };
  });

  const race = data.AmericasCupRace;
  const raceMetadata = raceMetadatas.find((m) => m.id === race.id);
  // vessels
  const inputBoats = _mapBoats(
    data.AmericasCupBoat.filter(
      (b) =>
        b.type === BOAT_TYPES.Yacht &&
        race.participants.includes(b.original_id),
    ),
  );

  // positions
  const racePositions = data.AmericasCupPosition;
  if (racePositions?.length === 0) {
    console.log('No race positions so skipping.');
    return;
  }
  const { boatPositions, markPositions } = _mapPositions(racePositions);

  // marks
  const { courseSequencedGeometries, markTrackers } = _mapSequencedGeometries(
    data.AmericasCupCompoundMark,
    data.AmericasCupMark,
    data.AmericasCupBoat.filter(
      (b) => b.type === BOAT_TYPES.Mark || b.type === BOAT_TYPES.RC,
    ),
  );

  const inputRace = {
    id: race.id,
    original_id: race.original_id,
    name: race.name,
    url: '',
    description: race.type,
  };
  await saveCompetitionUnit({
    event: regattas.find((regatta) => regatta.id === race.regatta),
    race: inputRace,
    boats: inputBoats,
    positions: boatPositions,
    raceMetadata,
    courseSequencedGeometries,
    markTrackers,
    markTrackerPositions: markPositions,
    reuse: {
      event: true,
      boats: true,
    },
  });
};

const _mapBoats = (boats) => {
  return boats?.map((b) => {
    const vessel = {
      id: b.id,
      publicName: b.boat_name || b.short_name || b.shorter_name,
      globalId: b.hull_num,
      vesselId: `${b.year}|${b.original_id}|${b.stowe_name}`,
      model: b.model,
      isCommittee: b.type !== BOAT_TYPES.Yacht,
    };

    // Boat Crew
    if (b.skipper) {
      vessel.crews = [
        {
          publicName: b.skipper,
        },
      ];
    }

    return vessel;
  });
};

const _mapPositions = (positions) => {
  const boatPositions = [];
  const markPositions = [];
  positions.forEach((p) => {
    const mappedPos = {
      timestamp: p.timestamp,
      lon: p.lon,
      lat: p.lat,
      cog: p.cog,
      sog: p.sog,
      vesselId: p.boat,
      heading: p.hdg,
      windSpeed: p.course_wind_speed,
      windDirection: p.course_wind_direction,
    };
    if (p.boat_type === BOAT_TYPES.Yacht) {
      boatPositions.push(mappedPos);
    } else if (
      p.boat_type === BOAT_TYPES.Mark ||
      p.boat_type === BOAT_TYPES.RC
    ) {
      mappedPos.markTrackerId = p.boat;
      markPositions.push(mappedPos);
    }
  });
  return { boatPositions, markPositions };
};

const _mapSequencedGeometries = (
  compoundMarks = [],
  marks = [],
  markAsBoats = [],
) => {
  const courseSequencedGeometries = [];
  const markTrackers = [];
  for (const cm of compoundMarks) {
    const cmMarks = marks.filter((m) => m.compound_mark === cm.id);
    if (cmMarks.length === 1) {
      const cmMark = cmMarks[0];
      const markAsBoat = markAsBoats.find(
        (b) => b.original_id === cmMark.original_id,
      );
      if (markAsBoat) {
        markTrackers.push({
          id: markAsBoat.id,
          name: markAsBoat.name,
        });
      }

      const newPoint = createGeometryPoint({
        lat: +cmMark.lat,
        lon: +cmMark.lon,
        markTrackerId: markAsBoat?.id,
        properties: {
          name: cmMark.name,
          markOriginalId: cmMark.original_id,
          rounding: cm.rounding,
        },
      });
      newPoint.id = cm.id;
      newPoint.order = cm.seq_id;
      courseSequencedGeometries.push(newPoint);
    } else if (cmMarks.length > 1) {
      const coordinates = [];
      for (const cmMark of cmMarks) {
        const markAsBoat = markAsBoats.find(
          (b) => b.original_id === cmMark.original_id,
        );
        if (markAsBoat) {
          markTrackers.push({
            id: markAsBoat.id,
            name: markAsBoat.boat_name,
          });
        }

        coordinates.push(
          createGeometryPosition({
            lat: +cmMark.lat,
            lon: +cmMark.lon,
            markTrackerId: markAsBoat?.id,
          }),
        );
      }
      courseSequencedGeometries.push({
        ...createGeometry(
          coordinates,
          {
            name: cmMarks
              .reduce((acc, m) => {
                if (m.name) {
                  acc.push(m.name);
                }
                return acc;
              }, [])
              .join(' - '),
            rounding: cm.rounding,
          },
          geometryType.LINESTRING,
        ),
        id: cm.id,
        order: cm.seq_id,
      });
    }
  }

  return { courseSequencedGeometries, markTrackers };
};

module.exports = mapAndSave;
