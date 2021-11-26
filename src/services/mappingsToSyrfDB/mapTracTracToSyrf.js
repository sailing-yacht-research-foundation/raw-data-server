const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');

const mapTracTracToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapTracTracToSyrf requires raceMetadata`);
    return;
  }

  // event
  const event = data.TracTracEvent.map((e) => {
    const starTimeObj = new Date(`${e.start} +0`);
    const stopTimeObj = new Date(`${e.end} +0`);
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      url: e.web_url,
      locationName: e.city,
      approxStartTimeMs: starTimeObj.getTime(),
      approxEndTimeMs: stopTimeObj.getTime(),
    };
  })[0];

  console.log('Saving to main database');
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.TracTracCompetitor, boatIdToOriginalIdMap);

  const controlPointToMarkTrackerId = {};
  data.TracTracControlPoint = data.TracTracControlPoint.map((t) => {
    const markTrackerId = uuidv4();
    controlPointToMarkTrackerId[t.id] = markTrackerId;
    return { ...t, markTrackerId };
  });

  data.TracTracControlPointPosition = data.TracTracControlPointPosition.map(
    (t) => {
      return {
        ...t,
        markTrackerId: controlPointToMarkTrackerId[t.controlpoint],
      };
    },
  );

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.TracTracControlPoint,
    data.TracTracControlPointPosition,
  );
  const positions = _mapPositions(data.TracTracCompetitorPosition);

  const rankings = _mapRankings(
    data.TracTracCompetitor,
    data.TracTracCompetitorResult,
  );

  await saveCompetitionUnit({
    event,
    race: {
      original_id: data.YellowbrickRace[0].race_code,
      url: data.YellowbrickRace[0].url,
    },
    boats: inputBoats,
    positions,
    raceMetadata,
    courseSequencedGeometries,
    rankings,
    markTrackerPositions: data.TracTracControlPointPosition,
  });
};

const _mapBoats = (boats, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.original_id?.toString(),
      model: b.class_name,
    };

    vessel.handicap = {};
    for (const key of Object.keys(b)) {
      if (key.indexOf('handicap') === -1 || isNaN(b[key]) || !b[key]) {
        continue;
      }
      vessel.handicap[key] = Number.parseFloat(b[key]);
    }
    return vessel;
  });
};

const _mapPositions = (positions) => {
  if (!positions) {
    return [];
  }
  positions.sort((a, b) => a.timestamp - b.timestamp);
  return positions.map((t) => {
    return {
      ...t,
      race_id: t.race,
      race_original_id: t.race_original_id,
      boat_id: t.competitor,
      vesselId: t.competitor,
      boat_original_id: t.competitor_original_id,
      cog: t.direction,
      sog: t.speed,
    };
  });
};

const _mapSequencedGeometries = (
  tracTracControlPoint = [],
  tracTracControlPointPosition = [],
) => {
  const courseSequencedGeometries = [];
  let order = 1;

  for (const currentControlPoint of tracTracControlPoint) {
    const position = _findControlPointFirstPosition(
      currentControlPoint.id,
      tracTracControlPointPosition,
    );

    if (!position) {
      continue;
    }
    const lat = position.lat;
    const lon = position.lon;
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryPoint({
        lat,
        lon,
        properties: {
          name: currentControlPoint.name?.trim(),
        },
        markTrackerId: currentControlPoint.markTrackerId,
      }),
      order: order,
    });
    order++;
  }
  return courseSequencedGeometries;
};

const _findControlPointFirstPosition = (id, tracTracControlPointPosition) => {
  const position = tracTracControlPointPosition.find(
    (t) => t.controlpoint === id,
  );
  return position;
};
const _mapRankings = (tracTracCompetitor, tracTracCompetitorResult = []) => {
  if (!tracTracCompetitor) {
    return [];
  }
  const rankings = [];
  for (const vessel of tracTracCompetitor) {
    const ranking = { vesselId: vessel.id, elapsedTime: 0, finishTime: 0 };

    if (vessel.status !== 'FIN') {
      continue;
    }

    const result = tracTracCompetitorResult.find(
      (t) => t.competitor === vessel.id,
    );
    let elapsedTime = 0;
    let finishTime = 0;
    if (result) {
      elapsedTime = Math.abs(result.time_elapsed * 1000) || 0;
      finishTime = result.start_time + elapsedTime;
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
module.exports = mapTracTracToSyrf;
