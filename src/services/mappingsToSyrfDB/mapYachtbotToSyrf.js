const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');

const mapYachtbotToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapYachtbotToSyrf requires raceMetadata`);
    return;
  }
  console.log('Saving to main database');
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.YachtBotYacht, boatIdToOriginalIdMap);

  data.YachtBotPosition.sort((a, b) => a.time - b.time);
  const buoyPositions = data.YachtBotPosition.filter(
    (t) => t.yacht_or_buoy !== 'yacht',
  );

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.YachtBotMarks,
    data.YachtBotBuoy,
    buoyPositions,
  );

  const yachtPositions = data.YachtBotPosition.filter(
    (t) => t.yacht_or_buoy === 'yacht',
  );
  const positions = _mapPositions(yachtPositions);

  const rankings = _mapRankings(data.YachtBotYacht, yachtPositions);

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

const _mapBoats = (yachtBotYacht, boatIdToOriginalIdMap) => {
  return yachtBotYacht?.map((b) => {
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

    const crew = JSON.parse(b.crew);
    const crews = [];
    if (crew.person?.length) {
      crews.push(
        ...crew.person.map((t) => {
          return {
            publicName: t?.person_name?.static_value || '',
            id: uuidv4(),
          };
        }),
      );
    }
    vessel.crews = crews;
    vessel.handicap = {};
    return vessel;
  });
};

const _mapPositions = (yachtBotPosition, boatIdToOriginalIdMap) => {
  if (!yachtBotPosition) {
    return [];
  }
  yachtBotPosition.sort((a, b) => a.time - b.time);
  return yachtBotPosition.map((t) => {
    return {
      ...t,
      timestamp: t.time,
      race_id: t.race,
      race_original_id: t.race_original_id?.toString(),
      boat_id: t.yacht,
      vesselId: t.yacht,
      boat_original_id: boatIdToOriginalIdMap[t.yacht],
      id: uuidv4(),
    };
  });
};

const _mapSequencedGeometries = (
  yachtBotMarks = [],
  yachtBotBuoy = [],
  buoyPositions = [],
) => {
  const courseSequencedGeometries = [];
  let order = 1;

  for (const mark of yachtBotMarks) {
    if (mark.processed) {
      continue;
    }

    const lat = mark.positions.position.latitude;
    const lon = mark.positions.position.longitude;
    if (!mark.connected_buoy) {
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryPoint({
          lat,
          lon,
          properties: {
            name: mark.name?.trim(),
            type: mark.buoy_type,
          },
        }),
        order: order,
      });
      order++;
      continue;
    }
    const connectedMark = yachtBotMarks.find(
      (t) => t.id === mark.connected_buoy,
    );

    if (connectedMark) {
      connectedMark.processed = true;
      const connectedMarkLat = connectedMark.positions.position.latitude;
      const connectedMarkLon = connectedMark.positions.position.longitude;
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryLine(
          { lat, lon },
          { lat: connectedMarkLat, lon: connectedMarkLon },
          {
            name: mark.name?.trim(),
            type: mark.buoy_type,
          },
        ),
        order: order,
      });
      order++;
      continue;
    }
    // find connected buoy
    const { buoy, position } = _findBuoyData(
      mark.connected_buoy_original_id,
      yachtBotBuoy,
      buoyPositions,
    );

    if (buoy && position) {
      const connectedMarkLat = position.latitude;
      const connectedMarkLon = position.longitude;
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryLine(
          { lat, lon },
          { lat: connectedMarkLat, lon: connectedMarkLon },
          {
            name: mark.name?.trim(),
            type: mark.buoy_type,
          },
        ),
        order: order,
      });
      order++;
    }
  }
  if (!yachtBotBuoy?.length) {
    return courseSequencedGeometries;
  }
  for (const currentBuoy of yachtBotBuoy) {
    if (currentBuoy.processed) {
      continue;
    }

    const position = _findBuoyFirstPosition(currentBuoy.id, buoyPositions);

    const lat = position?.latitude;
    const lon = position?.longitude;
    if (!currentBuoy.connected_buoy) {
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryPoint({
          lat,
          lon,
          properties: {
            name: currentBuoy.name?.trim(),
          },
        }),
        order: order,
      });
      order++;
      continue;
    }

    const connectedBuoy = yachtBotBuoy.find(
      (t) => t.id === currentBuoy.connected_buoy,
    );

    if (connectedBuoy) {
      connectedBuoy.processed = true;

      const connectedBuoyPisition = _findBuoyFirstPosition(
        connectedBuoy.id,
        buoyPositions,
      );
      if (!connectedBuoyPisition) {
        continue;
      }
      const connectedMarkLat = connectedBuoyPisition.latitude;
      const connectedMarkLon = connectedBuoyPisition.longitude;
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryLine(
          { lat, lon },
          { lat: connectedMarkLat, lon: connectedMarkLon },
          {
            name: currentBuoy.name?.trim(),
          },
        ),
        order: order,
      });
      order++;
      continue;
    }
  }

  return courseSequencedGeometries;
};

const _findBuoyData = (
  originalObjectId,
  yachtBotBuoy = [],
  buoyPositions = [],
  markAsProcess = true,
) => {
  if (!originalObjectId) {
    console.log(`originalObjectId should not be null`);
    return;
  }

  const buoy = yachtBotBuoy.find(
    (t) => t.orginal_object_id === originalObjectId,
  );

  if (!buoy) {
    console.log('can not findConnectedBouyData');
    return;
  }

  if (markAsProcess) {
    buoy.processed = true;
  }

  const position = _findBuoyFirstPosition(buoy.id, buoyPositions);

  return { buoy, position };
};

const _findBuoyFirstPosition = (id, buoyPositions) => {
  const position = buoyPositions.find((t) => t.buoy === id);
  return position;
};

const _mapRankings = (yachtBotYacht = [], positions = []) => {
  const reversedPositions = positions.concat().reverse();
  const rankings = [];
  for (const yacht of yachtBotYacht) {
    const ranking = { id: yacht.id };
    const firstPosition = positions.find((t) => t.yacht === yacht.id);
    const lastPosition = reversedPositions.find((t) => t.yacht === yacht.id);
    if (firstPosition && lastPosition) {
      ranking.elapsedTime = lastPosition.time - firstPosition.time;
      ranking.finishTime = lastPosition.time;
    }
    rankings.push(ranking);
  }

  rankings.sort((a, b) => {
    const finishedTimeA = a.finishTime || Infinity;
    const finishedTimeB = b.finishTime || Infinity;
    return finishedTimeA - finishedTimeB;
  });

  return rankings;
};
module.exports = mapYachtbotToSyrf;
