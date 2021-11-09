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
  );
  const positions = _mapPositions(data.YellowbrickPosition);

  const rankings = _mapRankings(data.YellowbrickTeam);

  await saveCompetitionUnit({
    race: {
      original_id: data.YellowbrickRace[0].race_code,
      url: data.YellowbrickRace[0].url,
      scrapedUrl: data.YellowbrickRace[0].slug,
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
      vesselId: b.id,
      model: b.model,
      lengthInMeters: null,
      widthInMeters: null,
      draftInMeters: null,
    };

    if (b.owner) {
      vessel.crews = [{ publicName: b.owner, id: uuidv4() }];
    }
    vessel.handicap = {};
    for (const key of Object.keys(b)) {
      if (key.indexOf('tcf') === -1 || isNaN(b[key])) {
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

const _mapSequencedGeometries = (yellowbrickCourseNodes) => {
  const courseSequencedGeometries = [];
  for (const yellowbrickCourseNode of yellowbrickCourseNodes) {
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryPoint(
        yellowbrickCourseNode.lat,
        yellowbrickCourseNode.lon,
      ),
      properties: {
        name: yellowbrickCourseNode.name?.trim(),
      },
      order: yellowbrickCourseNode.order,
    });
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
