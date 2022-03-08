const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const { vesselEvents } = require('../../syrf-schema/enums');
const { v4: uuidv4 } = require('uuid');

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

  const passingEvents = _mapPassings(markPassings);

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
          name: m.name,
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
          name: m.name,
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

const _mapPassings = (passings) => {
  return passings.map((p) => {
    const id = uuidv4();
    return {
      competitionUnitId: p.race_id,
      vesselId: p.competitor_boat_id,
      markId: id,
      eventType: vesselEvents.rounding,
      eventTime: p.time_as_millis,
    };
  });
};

module.exports = mapAndSave;
