const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');
const { geometryType } = require('../../syrf-schema/enums');

const mapYellowBrickToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapYellowBrickToSyrf requires raceMetadata`);
    return;
  }
  console.log('Saving to main database');
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.YellowbrickTeam, boatIdToOriginalIdMap);
  const handicapMap = _mapHandicap(data.YellowbrickLeaderboardTeam);

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.YellowbrickCourseNode,
    data.YellowbrickPoi,
  );
  const positions = _mapPositions(data.YellowbrickPosition);

  const rankings = _mapRankings(
    data.YellowbrickTeam,
    data.YellowbrickLeaderboardTeam,
  );

  const race = data.YellowbrickRace[0];
  return await saveCompetitionUnit({
    race: {
      original_id: race.race_code,
      name: race.title,
      url: race.url,
    },
    boats: inputBoats,
    positions,
    raceMetadata,
    courseSequencedGeometries,
    rankings,
    handicapMap,
    competitionUnitData: {
      handicap: data.YellowbrickTag
        ? [
            ...data.YellowbrickTag.reduce((acc, t) => {
              if (t.handicap) {
                acc.add(t.handicap);
              }
              return acc;
            }, new Set()),
          ]
        : null,
    },
  });
};

const _mapBoats = (yellowbrickTeam, boatIdToOriginalIdMap) => {
  return yellowbrickTeam?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.original_id?.toString(),
      globalId: b.sail,
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

const _mapHandicap = (yellowbrickLeaderboardTeam = []) => {
  const handicapMap = {};
  for (const leaderBoard of yellowbrickLeaderboardTeam) {
    if (
      leaderBoard?.type?.toLowerCase() === 'level' ||
      !leaderBoard.tcf ||
      isNaN(leaderBoard.tcf)
    ) {
      continue;
    }
    if (!handicapMap[leaderBoard.team]) {
      handicapMap[leaderBoard.team] = {};
    }
    handicapMap[leaderBoard.team][leaderBoard?.type?.toLowerCase()] =
      +leaderBoard.tcf;
  }
  return handicapMap;
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

const _mapSequencedGeometries = (
  yellowbrickCourseNodes = [],
  yellowbrickPoi = [],
) => {
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
  if (!yellowbrickPoi?.length) {
    return courseSequencedGeometries;
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
    if (positions.length === 2) {
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
      continue;
    }
    const coordinates = [];
    const type = poi.polygon ? geometryType.POLYGON : geometryType.LINESTRING;
    while (positions.length) {
      const lat = +positions.shift();
      const lon = +positions.shift();
      coordinates.push(gisUtils.createGeometryPosition({ lat, lon }));
    }
    courseSequencedGeometries.push({
      ...gisUtils.createGeometry(
        coordinates,
        {
          name: poi.name?.trim(),
        },
        type,
      ),
      order: order,
    });
    order++;
  }

  return courseSequencedGeometries;
};

const _mapRankings = (yellowbrickTeam, yellowbrickLeaderboardTeam = []) => {
  if (!yellowbrickTeam) {
    return [];
  }

  const rankings = [];
  let hasRank = false;
  for (const team of yellowbrickTeam) {
    const ranking = { vesselId: team.id };
    //  the type is LEVEL the tcf are 1 which means it's the uncalculated time
    const leaderBoardTeam = yellowbrickLeaderboardTeam.find(
      (t) => t.team === team.id && t.type === 'LEVEL' && t.tcf === '1.000',
    );
    let elapsedTime = 0;
    let finishTime = 0;
    if (leaderBoardTeam) {
      elapsedTime = leaderBoardTeam.elapsed * 1000 || 0;
      finishTime = leaderBoardTeam.finished_at * 1000 || 0;
      ranking.rank = leaderBoardTeam.rank_r || leaderBoardTeam.rank_s;
      if (!hasRank && ranking.rank) {
        hasRank = true;
      }
    }
    if (
      team.finished_at &&
      !isNaN(team.finished_at) &&
      !elapsedTime &&
      !finishTime
    ) {
      elapsedTime = (team.finished_at - team.start) * 1000;
      finishTime = team.finished_at * 1000;
    }
    ranking.elapsedTime = elapsedTime;
    ranking.finishTime = finishTime;
    rankings.push(ranking);
  }

  rankings.sort((a, b) => {
    if (hasRank) {
      const rankA = !isNaN(a.rank) ? a.rank : Infinity;
      const rankB = !isNaN(b.rank) ? b.rank : Infinity;
      return rankA - rankB;
    }
    const finishedTimeA = a.finishTime || Infinity;
    const finishedTimeB = b.finishTime || Infinity;
    return finishedTimeA - finishedTimeB;
  });

  return rankings;
};
module.exports = mapYellowBrickToSyrf;
