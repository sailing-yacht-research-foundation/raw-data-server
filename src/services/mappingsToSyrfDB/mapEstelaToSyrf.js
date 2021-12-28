const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');
  // vessels
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(
    data.EstelaDorsal,
    data.EstelaPlayer,
    boatIdToOriginalIdMap,
  );

  // positions
  const inputPositions = _mapPositions(
    data.EstelaPosition,
    boatIdToOriginalIdMap,
  );

  // marks
  const courseSequencedGeometries = _mapSequencedGeometries(data.EstelaBuoy);

  // rankings
  const rankings = _mapRankings(
    data.EstelaResult,
    raceMetadata.approx_start_time_ms,
  );

  await saveCompetitionUnit({
    race: data.EstelaRace[0],
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

const _mapBoats = (boats, crews, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      globalId: b.number,
      vesselId: b.original_id,
      model: b.model,
      isCommittee: b.committee?.toString() === '1',
    };

    // Boat Crew
    vessel.crews = crews
      ?.filter((c) => c.dorsal === b.id)
      .map((c) => ({
        id: c.id,
        publicName: c.name,
      }));

    return vessel;
  });
};

const _mapPositions = (positions, boatIdToOriginalIdMap) => {
  return positions?.map((p) => ({
    ...p,
    vesselId: boatIdToOriginalIdMap[p.dorsal_original_id],
    cog: p.c,
    sog: p.s,
    windSpeed: p.w,
    windDirection: p.y,
  }));
};

const _mapSequencedGeometries = (buoys) => {
  const courseSequencedGeometries = [];
  if (!buoys?.length) {
    return courseSequencedGeometries;
  }

  // Need to make sure to sort by index because if buoy is a door the next in the index is the connection to form a line
  buoys.sort((a, b) => a.index - b.index);
  let index = buoys[0].index;
  while (buoys[buoys.length - 1].index > index) {
    const buoy = buoys[index];
    if (buoy) {
      if (buoy.door) {
        index++;
        const connectingPoint = buoys[index];
        if (connectingPoint) {
          const line = createGeometryLine(
            {
              lat: buoy.lat,
              lon: buoy.lon,
            },
            {
              lat: connectingPoint.lat,
              lon: connectingPoint.lon,
            },
            {
              name: [buoy.name, connectingPoint.name]
                .filter(Boolean)
                .join(' - '),
            },
          );
          line.order = buoy.index;
          courseSequencedGeometries.push(line);
        }
      } else {
        const newPoint = createGeometryPoint({
          lat: buoy.lat,
          lon: buoy.lon,
          properties: {
            name: buoy.name,
          },
        });
        newPoint.order = buoy.index;
        courseSequencedGeometries.push(newPoint);
      }
    }
    index++;
  }
  return courseSequencedGeometries;
};

const _mapRankings = (results, raceStart) => {
  return results
    ?.map((r) => {
      const finishTime = r.timestamp * 1000;
      return {
        vesselId: r.dorsal,
        finishTime,
        elapsedTime: raceStart - finishTime,
      };
    })
    .sort((a, b) => (a.finishTime || Infinity) - (b.finishTime || Infinity));
};

module.exports = mapAndSave;
