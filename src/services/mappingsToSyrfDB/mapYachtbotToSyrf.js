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
  const boatMetaDataMap = {};
  const inputBoats = _mapBoats(
    data.YachtBotYacht,
    boatIdToOriginalIdMap,
    boatMetaDataMap,
  );

  data.YachtBotPosition.sort((a, b) => a.time - b.time);

  const markTrackers = [];
  const buoyIdToMarkTrackerMap = {};
  data.YachtBotBuoy = data.YachtBotBuoy?.map((t) => {
    const id = uuidv4();
    buoyIdToMarkTrackerMap[t.id] = id;
    markTrackers.push({ id, name: t.name });
    return { ...t, markTrackerId: id };
  });

  const buoyPositions = data.YachtBotPosition?.filter(
    (t) => t.yacht_or_buoy !== 'yacht' && t.buoy,
  ).map((t) => {
    return { ...t, markTrackerId: buoyIdToMarkTrackerMap[t.buoy] };
  });
  const courseSequencedGeometries = _mapSequencedGeometries(
    data.YachtBotMark,
    data.YachtBotBuoy,
    buoyPositions,
  );

  const yachtPositions = data.YachtBotPosition?.filter(
    (t) => t.yacht_or_buoy === 'yacht',
  );
  const positions = _mapPositions(yachtPositions, boatMetaDataMap);

  const race = data.YachtBotRace[0];
  return await saveCompetitionUnit({
    race: {
      original_id: race.original_id.toString(),
      name: race.name,
      url: race.url,
    },
    boats: inputBoats,
    positions,
    raceMetadata,
    courseSequencedGeometries,
    markTrackers: markTrackers,
    markTrackerPositions: buoyPositions,
    reuse: {
      boats: true,
    },
  });
};

const _mapBoats = (yachtBotYacht, boatIdToOriginalIdMap, boatMetaDataMap) => {
  return yachtBotYacht?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;

    const vessel = {
      id: b.id,
      publicName: b.name,
      globalId: b.boat_number,
      sailNumber: b.boat_number,
      vesselId: `${b.original_id?.toString()}-${b.original_object_id}`,
      model: b.model,
    };

    _mapMetadata(boatMetaDataMap, b);
    try {
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
    } catch (err) {
      console.log('Invalid crew object. Skipping crews.');
    }
    return vessel;
  });
};

const _mapPositions = (yachtBotPosition, boatMetaDataMap) => {
  if (!yachtBotPosition) {
    return [];
  }
  yachtBotPosition.sort((a, b) => a.time - b.time);
  return yachtBotPosition.map((t) => {
    const metadata = boatMetaDataMap[t.yacht];
    return {
      ...t,
      timestamp: t.time,
      race_id: t.race,
      race_original_id: t.race_original_id?.toString(),
      boat_id: t.yacht,
      vesselId: t.yacht,
      boat_original_id: t.yacht_original_id,
      id: uuidv4(),
      cog: metadata?.cog?.[t.time],
      sog: metadata?.sog?.[t.time],
      twa: metadata?.twa?.[t.time],
      windSpeed: metadata?.aws?.[t.time],
      windDirection: metadata?.awa?.[t.time],
      heading: metadata?.hdg?.[t.time],
    };
  });
};

const _mapMetadata = (boatMetaDataMap, yachtBotYacht) => {
  const { id, metas } = yachtBotYacht;
  if (!metas) {
    return;
  }
  boatMetaDataMap[id] = { cog: {}, sog: {}, twa: {} };
  try {
    const metaObject = JSON.parse(metas);
    const { cog, sog, twa, awa, aws } = metaObject;
    boatMetaDataMap[id].cog = _mapMetaDataToObject(cog, 't', '1');
    boatMetaDataMap[id].sog = _mapMetaDataToObject(sog, 't', '1');
    boatMetaDataMap[id].twa = _mapMetaDataToObject(twa, 't', '1');
    // awa wind angel, aws wind speed
    boatMetaDataMap[id].awa = _mapMetaDataToObject(awa, 't', '1');
    boatMetaDataMap[id].aws = _mapMetaDataToObject(aws, 't', '1');
  } catch (e) {
    console.log('error while processing _mapMetaData');
    console.log(e);
  }
};

const _mapMetaDataToObject = (metadataObject, timeField, valueField) => {
  if (!metadataObject) {
    return {};
  }
  const result = {};
  for (let i = 0; i < metadataObject[timeField].length; i++) {
    const currentTime = metadataObject[timeField][i];
    const value = metadataObject[valueField][i];
    result[currentTime] = value;
  }
  return result;
};

const _mapSequencedGeometries = (
  marks = [],
  buoys = [],
  buoyPositions = [],
) => {
  const courseSequencedGeometries = [];
  let order = 1;

  for (const mark of marks) {
    if (mark.processed) {
      continue;
    }

    const lat = mark.lat;
    const lon = mark.lon;
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
    const connectedMark = marks.find((t) => t.id === mark.connected_buoy);

    if (connectedMark) {
      connectedMark.processed = true;
      const connectedMarkLat = connectedMark.lat;
      const connectedMarkLon = connectedMark.lon;
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryLine(
          {
            lat,
            lon,
            properties: {
              name: mark.name?.trim(),
              type: mark.type,
            },
          },
          {
            lat: connectedMarkLat,
            lon: connectedMarkLon,
            properties: {
              name: connectedMark.name?.trim(),
              type: connectedMark.type,
            },
          },
          {
            name: mark.name?.trim(),
            type: mark.type,
          },
        ),
        order: order,
      });
      order++;
      continue;
    }
    // find connected buoy
    const buoyData = _findBuoyData(
      mark.connected_buoy_original_id,
      buoys,
      buoyPositions,
    );

    if (!buoyData?.buoy || !buoyData.position) {
      continue;
    }
    const { buoy, position } = buoyData;

    courseSequencedGeometries.push({
      ...gisUtils.createGeometryLine(
        {
          lat,
          lon,
          properties: {
            name: mark.name?.trim(),
            type: mark.type,
          },
        },
        {
          lat: position.lat,
          lon: position.lon,
          markTrackerId: buoy.markTrackerId,
          properties: {
            name: buoy.name?.trim(),
            type: buoy.buoy_type,
          },
        },
        {
          name: mark.name?.trim(),
          type: mark.type,
        },
      ),
      order: order,
    });
    order++;
  }
  if (!buoys.length) {
    return courseSequencedGeometries;
  }
  for (const currentBuoy of buoys) {
    if (currentBuoy.processed) {
      continue;
    }

    const position = _findBuoyFirstPosition(currentBuoy.id, buoyPositions);

    if (!position) {
      continue;
    }
    const lat = position.lat;
    const lon = position.lon;
    if (!currentBuoy.connected_buoy) {
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryPoint({
          lat,
          lon,
          properties: {
            name: currentBuoy.name?.trim(),
            type: currentBuoy.buoy_type,
          },
          markTrackerId: currentBuoy.markTrackerId,
        }),
        order: order,
      });
      order++;
      continue;
    }

    const connectedBuoy = buoys.find(
      (t) => t.id === currentBuoy.connected_buoy,
    );

    if (!connectedBuoy) {
      continue;
    }
    connectedBuoy.processed = true;

    const connectedBuoyPosition = _findBuoyFirstPosition(
      connectedBuoy.id,
      buoyPositions,
    );
    if (!connectedBuoyPosition) {
      continue;
    }
    const connectedMarkLat = connectedBuoyPosition.lat;
    const connectedMarkLon = connectedBuoyPosition.lon;

    courseSequencedGeometries.push({
      ...gisUtils.createGeometryLine(
        {
          lat,
          lon,
          markTrackerId: currentBuoy.markTrackerId,
          properties: {
            name: currentBuoy.name?.trim(),
            type: currentBuoy.buoy_type,
          },
        },
        {
          lat: connectedMarkLat,
          lon: connectedMarkLon,
          markTrackerId: connectedBuoy.markTrackerId,
          properties: {
            name: connectedBuoy.name?.trim(),
            type: connectedBuoy.buoy_type,
          },
        },
        {
          name: currentBuoy.name?.trim(),
          type: currentBuoy.buoy_type,
        },
      ),
      order: order,
    });
    order++;
  }

  return courseSequencedGeometries;
};

const _findBuoyData = (
  originalObjectId,
  buoys = [],
  buoyPositions = [],
  markAsProcess = true,
) => {
  if (!originalObjectId) {
    console.log(`originalObjectId should not be null`);
    return;
  }

  const buoy = buoys.find((t) => t.original_object_id === originalObjectId);

  if (!buoy) {
    console.log(
      `No connected buoy. Original object id ${originalObjectId} does not exist in buoys`,
    );
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

module.exports = mapYachtbotToSyrf;
