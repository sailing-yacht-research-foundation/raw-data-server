const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');
const { geometryType } = require('../../syrf-schema/enums');

const mapTracTracToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapTracTracToSyrf requires raceMetadata`);
    return;
  }
  if (!data.TracTracRace?.length) {
    console.log(`mapTracTracToSyrf requires TracTracRace`);
    return;
  }
  // event
  const event = data.TracTracEvent?.map((e) => {
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
  const markTrackers = [];
  data.TracTracControlPoint = data.TracTracControlPoint?.map((t) => {
    const markTrackerId = uuidv4();
    controlPointToMarkTrackerId[t.id] = markTrackerId;
    markTrackers.push({ id: markTrackerId, name: t.name });
    return { ...t, markTrackerId };
  });

  data.TracTracControlPointPosition = data.TracTracControlPointPosition?.map(
    (t) => {
      return {
        ...t,
        markTrackerId: controlPointToMarkTrackerId[t.controlpoint],
      };
    },
  );

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.TracTracControl,
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
      id: data.TracTracRace[0].id,
      original_id: data.TracTracRace[0].original_id,
      url: data.TracTracRace[0].url,
      scrapedUrl: data.TracTracRace[0].url,
    },
    boats: inputBoats,
    positions,
    raceMetadata,
    courseSequencedGeometries,
    rankings,
    markTrackers,
    markTrackerPositions: data.TracTracControlPointPosition,
    reuse: {
      event: true,
      boats: true,
    },
  });
};

const _mapBoats = (boats, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.original_id,
      model: b.class_name,
      handicap: {},
    };

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
      vesselId: t.competitor,
      boat_original_id: t.competitor_original_id,
      cog: t.direction,
      sog: t.speed,
    };
  });
};

const _mapSequencedGeometries = (
  tracTracControl = [],
  tracTracControlPoint = [],
  tracTracControlPointPosition = [],
) => {
  const courseSequencedGeometries = [];
  let order = 1;

  for (const control of tracTracControl) {
    const controlPoints = tracTracControlPoint.filter(
      (t) => t.control === control.id,
    );
    // no control point
    if (controlPoints.length === 0) {
      continue;
    }
    const coordinates = [];
    for (const currentControlPoint of controlPoints) {
      const position = _findControlPointFirstPosition(
        currentControlPoint.id,
        tracTracControlPointPosition,
      );
      if (!position) {
        continue;
      }
      const lat = position.lat;
      const lon = position.lon;
      coordinates.push(
        gisUtils.createGeometryPosition({
          lat,
          lon,
          markTrackerId: currentControlPoint.markTrackerId,
        }),
      );
    }
    const type =
      controlPoints.length === 1 ? geometryType.POINT : geometryType.LINESTRING;
    courseSequencedGeometries.push({
      ...gisUtils.createGeometry(coordinates, { name: control.name }, type),
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
