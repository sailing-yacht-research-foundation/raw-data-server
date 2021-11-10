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

  const rankings = _mapRankings(
    data.YellowbrickTeam,
    data.YellowbrickLeaderboardTeam,
  );

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

    const isNotNumber = positions.find((t) => isNaN(t));
    if (isNotNumber) {
      continue;
    }
    const coordinates = [];
    // positions length = 2 => point
    // positions length = 4 => 2 points => line
    // positions length > 4 => multiple points => polygon
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
        break;
    }
    order++;
  }

  return courseSequencedGeometries;
};

const _mapRankings = (yellowbrickTeam, yellowbrickLeaderboardTeam = []) => {
  if (!yellowbrickTeam) {
    return [];
  }

  const rankings = [];
  for (const team of yellowbrickTeam) {
    const ranking = { id: team.id };
    //  the type is LEVEL the tcf are 1 which means it's the uncalculated time
    const leaderBoardTeam = yellowbrickLeaderboardTeam.find(
      (t) => t.team === team.id && t.type === 'LEVEL' && t.tcf === '1.000',
    );
    let elapsedTime = 0;
    let finishTime = 0;
    if (
      leaderBoardTeam &&
      leaderBoardTeam.elapsed &&
      leaderBoardTeam.finished_at
    ) {
      elapsedTime = leaderBoardTeam.elapsed * 1000;
      finishTime = leaderBoardTeam.finished_at * 1000;
    }
    if (team.finshed_at && !elapsedTime && !finishTime) {
      elapsedTime = (team.finshed_at - team.start) * 1000;
      finishTime = team.finshed_at * 1000;
    }
    ranking.elapsedTime = elapsedTime;
    ranking.finishTime = finishTime;
    rankings.push(ranking);
  }
  rankings.sort((a, b) => {
    const finishedTimeA = a.finishTime || Infinity;
    const finishedTimeB = b.finishTime || Infinity;
    return finishedTimeA - finishedTimeB;
  });
  return rankings;
};
module.exports = mapYellowBrickToSyrf;
