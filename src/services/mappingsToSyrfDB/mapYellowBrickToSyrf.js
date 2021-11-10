const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');

const mapYellowBrickToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapYellowBrickToSyrf requires raceMetadata`);
    return;
  }
  console.log('Saving to main database');
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.YellowbrickTeam, boatIdToOriginalIdMap);

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.YellowbrickCourseNode,
    data.YellowbrickPoi,
  );
  const positions = _mapPositions(data.YellowbrickPosition);

  const rankings = _mapRankings(data.YellowbrickTeam);

  await saveCompetitionUnit({
    race: {
      original_id: data.YellowbrickRace[0].race_code,
      url: data.YellowbrickRace[0].url,
    },
    boats: inputBoats,
    positions,
    raceMetadata,
    courseSequencedGeometries,
    rankings,
  });
};

const _mapBoats = (yellowbrickTeam, boatIdToOriginalIdMap) => {
  return yellowbrickTeam?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.original_id?.toString(),
      model: b.model,
      lengthInMeters: null,
      widthInMeters: null,
      draftInMeters: null,
    };

    const crews = [];
    if (b.owner) {
      crews.push({ publicName: b.owner, id: uuidv4() });
    }

    if (b.captain && b.owner?.toLowerCase() !== b.captain.toLowerCase()) {
      crews.push({ publicName: b.captain, id: uuidv4() });
    }
    vessel.crews = crews;
    vessel.handicap = {};
    for (const key of Object.keys(b)) {
      if (key.indexOf('tcf') === -1 || isNaN(b[key]) || !b[key]) {
        continue;
      }
      vessel.handicap[key] = Number.parseFloat(b[key]);
    }
    return vessel;
  });
};

const _mapPositions = (yellowbrickPosition) => {
  if (!yellowbrickPosition) {
    return [];
  }
  yellowbrickPosition.sort((a, b) => a.timestamp - b.timestamp);
  return yellowbrickPosition.map((t) => {
    return {
      ...t,
      sog: t.sog_knots,
      race_id: t.race,
      race_original_id: t.race_code,
      boat_id: t.team,
      vesselId: t.team,
      boat_original_id: t.team_original_id,
      id: uuidv4(),
    };
  });
};

const _mapSequencedGeometries = (yellowbrickCourseNodes, yellowbrickPoi) => {
  const courseSequencedGeometries = [];
  let order = 1;
  for (const yellowbrickCourseNode of yellowbrickCourseNodes) {
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryPoint({
        lat: yellowbrickCourseNode.lat,
        lon: yellowbrickCourseNode.lon,
        properties: {
          name: yellowbrickCourseNode.name?.trim(),
        },
      }),
      order: order,
    });
    order++;
  }
  if (!yellowbrickPoi || !yellowbrickPoi.length) {
    return;
  }
  // poi schema
  // {id:string, nodes: string, polygon: boolean}
  for (const poi of yellowbrickPoi) {
    if (!poi.nodes) {
      continue;
    }
    const positions = poi.nodes.split(',');
    // the positions should go by pair [lat, lon], so it should be even number
    if (positions.length < 2 || positions.length % 2 !== 0) {
      continue;
    }
    const coordinates = [];
    switch (positions.length) {
      case 2:
        //point
        courseSequencedGeometries.push({
          ...gisUtils.createGeometryPoint({
            lat: +positions[0],
            lon: +positions[1],
            properties: {
              name: poi.name?.trim(),
            },
          }),
          order: order,
        });
        break;
      case 4:
        // polyline
        courseSequencedGeometries.push({
          ...gisUtils.createGeometryLine(
            {
              lat: +positions[0],
              lon: +positions[1],
            },
            {
              lat: +positions[2],
              lon: +positions[3],
            },
            {
              name: poi.name?.trim(),
            },
          ),
          order: order,
        });
        break;
      default:
        // polygon
        while (positions.length) {
          const lat = +positions.shift();
          const lon = +positions.shift();
          coordinates.push(gisUtils.createGeometryPosition({ lat, lon }));
        }
        courseSequencedGeometries.push({
          ...gisUtils.createGeometryPolygon(coordinates, {
            name: poi.name?.trim(),
          }),
          order: order,
        });
        // polygon
        break;
    }
    order++;
  }

  return courseSequencedGeometries;
};

const _mapRankings = (yellowbrickTeam) => {
  if (!yellowbrickTeam) {
    return [];
  }
  yellowbrickTeam.sort((a, b) => {
    const finishedTimeA = a.finshed_at || Infinity;
    const finishedTimeB = b.finshed_at || Infinity;

    return finishedTimeA - finishedTimeB;
  });
  return yellowbrickTeam.map((b) => {
    let elapsedTime = 0;
    let finishTime = 0;
    if (b.finshed_at) {
      elapsedTime = (b.finshed_at - b.start) * 1000;
      finishTime = b.finshed_at * 1000;
    }
    return {
      id: b.id,
      elapsedTime,
      finishTime,
    };
  });
};
module.exports = mapYellowBrickToSyrf;
