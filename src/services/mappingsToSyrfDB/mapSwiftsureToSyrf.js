const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');

  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.swiftsureBoat, boatIdToOriginalIdMap);

  const inputPositions = _mapPositions(
    data.swiftsurePosition,
    boatIdToOriginalIdMap,
  );

  const mapSequencedGeometries = _mapSequencedGeometries(
    data.swiftsureGeometry,
  );

  await saveCompetitionUnit({
    race: data.swiftsureRace[0],
    boats: inputBoats,
    positions: inputPositions,
    courseSequencedGeometries: mapSequencedGeometries,
    raceMetadata,
  });
};

const _mapBoats = (boats, boatIdToOriginalIdMap) => {
  return boats.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      vesselId: b.original_id,
      model: b.make,
    };
    return vessel;
  });
};

const _mapPositions = (positions, boatIdToOriginalIdMap) => {
  return positions.map((p) => ({
    timestamp: new Date(+p.timestamp).getTime(),
    lon: +p.lat,
    lat: +p.lon,
    cog: +p.heading,
    sog: +p.speed,
    vesselId: boatIdToOriginalIdMap[p.boat_original_id],
  }));
};

const _mapSequencedGeometries = ({ lines, points, marks }) => {
  const courseSequencedGeometries = [];
  let index = 0;

  if (lines.length === 0) return;

  //Start line
  const startLine = createGeometryLine(
    {
      lat: lines[0].lat1,
      lon: lines[0].lon1,
    },
    {
      lat: lines[0].lat2,
      lon: lines[0].lon2,
    },
    { name: lines[0].name },
  );
  startLine.order = 0;
  courseSequencedGeometries.push(startLine);

  //Points
  if (points.length > 0)
    points.forEach((p) => {
      const newPoint = createGeometryPoint({
        lat: p.lat,
        lon: p.lon,
        properties: { name: p.name },
      });
      newPoint.order = ++index;
      courseSequencedGeometries.push(newPoint);
    });

  //Marks
  if (marks.length > 0)
    marks.forEach((p) => {
      const newMark = createGeometryPoint({
        lat: p.lat,
        lon: p.lon,
        properties: { name: p.name },
      });
      newMark.order = ++index;
      courseSequencedGeometries.push(newMark);
    });

  //Finish line
  if (lines.length > 1) {
    const finishLine = createGeometryLine(
      {
        lat: lines[lines.length - 1].lat1,
        lon: lines[lines.length - 1].lon1,
      },
      {
        lat: lines[lines.length - 1].lat2,
        lon: lines[lines.length - 1].lon2,
      },
      { name: lines[lines.length - 1].name },
    );
    finishLine.order = ++index;
    courseSequencedGeometries.push(finishLine);
  }
  return courseSequencedGeometries;
};
module.exports = mapAndSave;
