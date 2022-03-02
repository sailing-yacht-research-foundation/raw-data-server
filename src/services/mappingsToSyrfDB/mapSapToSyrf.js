const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');

const mapAndSave = async (
  race,
  boats,
  positions,
  marks,
  markPositions,
  raceMetadata,
) => {
  console.log('Saving to main database');
  const inputBoats = _mapBoats(boats);

  const inputPositions = _mapPositions(positions);

  const mappedSequencedGeometries = _mapSequencedGeometries(
    marks,
    markPositions,
  );
  try {
    await saveCompetitionUnit({
      race: race,
      boats: inputBoats,
      positions: inputPositions,
      courseSequencedGeometries: mappedSequencedGeometries,
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
  let index = 0;

  marksPositions.forEach((element) => {
    const newPoint = createGeometryPoint({
      lat: element.lat_deg,
      lon: element.lng_deg,
      properties: { name: '' },
    });
    newPoint.order = index++;
    courseSequencedGeometries.push(newPoint);
  });
  return courseSequencedGeometries;
};

module.exports = mapAndSave;
