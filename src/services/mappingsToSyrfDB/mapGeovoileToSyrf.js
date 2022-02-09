const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');

const mapGeovoileToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapGeovoileToSyrf requires raceMetadata`);
  }
  console.log('Saving to main database');
  data.boats.sort((a, b) => {
    const firstBoatRanking = a.arrival ? a.arrival.rank : Infinity;
    const secondBoatRanking = b.arrival ? b.arrival.rank : Infinity;

    return firstBoatRanking - secondBoatRanking;
  });

  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.boats, data.sailors, boatIdToOriginalIdMap);

  // positions
  const inputPositions = _mapPositions(data.positions, boatIdToOriginalIdMap);

  // marks
  const courseSequencedGeometries = _mapSequencedGeometries(
    data.marks,
    data.courseGates,
  );

  // rankings
  const rankings = _mapRankings(data.boats, data.geovoileRace);

  await saveCompetitionUnit({
    race: data.geovoileRace,
    boats: inputBoats,
    positions: inputPositions,
    raceMetadata,
    courseSequencedGeometries,
    rankings,
    reuse: {
      boats: true,
    },
  });
};

const _mapBoats = (boats, sailors, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.original_id,
      isCommittee: false,
    };

    // Boat Crew
    vessel.crews = sailors
      ?.filter((c) => c.boat_id === b.id)
      .map((c) => ({
        id: c.id,
        publicName: c.short_name,
      }));

    return vessel;
  });
};

const _mapPositions = (positions, boatIdToOriginalIdMap) => {
  return positions?.map((p) => ({
    ...p,
    vesselId: boatIdToOriginalIdMap[p.boat_original_id],
    cog: p.heading,
    timestamp: +p.timecode * 1000,
  }));
};

const _mapSequencedGeometries = (marks, courseGates = []) => {
  courseGates.sort((a, b) => a.order - b.order);
  let order = 0;

  const courseSequencedGeometries = [];

  for (const courseGate of courseGates) {
    courseSequencedGeometries.push({ ...courseGate, order: order });
    order++;
  }
  for (const mark of marks) {
    const newPoint = createGeometryPoint({
      lat: mark.lat,
      lon: mark.lon,
      properties: {
        name: mark.name?.trim() || mark.type,
        type: mark.type,
        poi: true,
      },
    });
    courseSequencedGeometries.push({ ...newPoint, order });
  }
  return courseSequencedGeometries;
};

const _mapRankings = (boats, geovoileRace) => {
  const rankings = boats.map((b) => {
    let finishTime = 0;

    if (b.arrival) {
      if (b.arrival.timecode) {
        finishTime = b.arrival.timecode * 1000;
      } else if (b.arrival.racetime) {
        finishTime = (geovoileRace.startTime + b.arrival.racetime) * 1000;
      }
    }

    return {
      vesselId: b.id,
      elapsedTime: b.arrival ? b.arrival.racetime * 1000 : 0,
      finishTime: finishTime,
    };
  });
  return rankings;
};

module.exports = mapGeovoileToSyrf;
