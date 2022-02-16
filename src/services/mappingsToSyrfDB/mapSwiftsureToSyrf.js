const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');

  const eventYear = raceMetadata.start_year;
  const eventCity = raceMetadata.start_city;

  if (!raceMetadata.name) raceMetadata.name = eventYear + ' ' + eventCity;

  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.swiftsureBoat, boatIdToOriginalIdMap);

  const inputPositions = _mapPositions(
    data.swiftsurePosition,
    boatIdToOriginalIdMap,
  );

  const mapedSequencedGeometries = _mapSequencedGeometries(
    data.swiftsureGeometry,
  );

  await saveCompetitionUnit({
    race: data.swiftsureRace[0],
    boats: inputBoats,
    positions: inputPositions,
    courseSequencedGeometries: mapedSequencedGeometries,
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
      publicName: b.boat_name ? b.boat_name : b.team_name,
      handicap: b.scoring,
    };
    return vessel;
  });
};

const _mapPositions = (positions, boatIdToOriginalIdMap) => {
  return positions.map((p) => ({
    timestamp: p.timestamp * 1000,
    lon: p.lon,
    lat: p.lat,
    cog: p.heading,
    sog: p.speed,
    vesselId: boatIdToOriginalIdMap[p.boat_original_id],
  }));
};

const _mapSequencedGeometries = ({ lines, points, marks }) => {
  const courseSequencedGeometries = [];
  let index = 0;

  if (lines.length === 0) return;

  //Start line
  lines.forEach((p) => {
    if (p.name.includes('Start')) {
      const startLine = createGeometryLine(
        {
          lat: p.lat1,
          lon: p.lon1,
        },
        {
          lat: p.lat2,
          lon: p.lon2,
        },
        { name: p.name },
      );
      startLine.order = index++;
      courseSequencedGeometries.push(startLine);
    }
  });

  //Halfway line
  lines.forEach((p) => {
    if (p.name.includes('Halfway')) {
      const halfwaytLine = createGeometryLine(
        {
          lat: p.lat1,
          lon: p.lon1,
        },
        {
          lat: p.lat2,
          lon: p.lon2,
        },
        { name: p.name },
      );
      halfwaytLine.order = index++;
      courseSequencedGeometries.push(halfwaytLine);
    }
  });

  //Points
  if (points.length > 0)
    points.forEach((p) => {
      const newPoint = createGeometryPoint({
        lat: p.lat,
        lon: p.lon,
        properties: { name: p.name },
      });
      newPoint.order = index++;
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
      newMark.order = index++;
      courseSequencedGeometries.push(newMark);
    });

  //Finish line
  lines.forEach((p) => {
    if (p.name.includes('Finish')) {
      const finishLine = createGeometryLine(
        {
          lat: p.lat1,
          lon: p.lon1,
        },
        {
          lat: p.lat2,
          lon: p.lon2,
        },
        { name: p.name },
      );
      finishLine.order = index++;
      courseSequencedGeometries.push(finishLine);
    }
  });

  return courseSequencedGeometries;
};
module.exports = mapAndSave;
