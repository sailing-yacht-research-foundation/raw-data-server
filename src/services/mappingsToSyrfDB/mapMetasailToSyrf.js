const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const { v4: uuidv4 } = require('uuid');

const mapMetasailToSyrf = async (data, raceMetadatas) => {
  if (!raceMetadatas?.length) {
    console.log(`mapMetasailToSyrf requires raceMetadatas`);
    return;
  }
  if (!data.MetasailRace?.length) {
    console.log(`mapMetasailToSyrf requires MetasailRace`);
    return;
  }
  // event
  const event = data.MetasailEvent?.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      url: e.url,
      approxStartTimeMs: e.start * 1000,
      approxEndTimeMs: e.end * 1000,
    };
  })[0];

  for (const race of data.MetasailRace) {
    const raceMetadata = raceMetadatas.find((t) => t.id === race.id);
    if (!raceMetadata) {
      console.log(`raceMetadata is not found for ${race.original_id}`);
      return;
    }

    console.log('Saving to main database');
    const inputBoats = _mapBoats(data.MetasailBoat, race);

    if (!inputBoats.length) {
      console.log(
        `inputBoats positions is not found for  race = ${race.original_id}`,
      );
      continue;
    }
    const { courseSequencedGeometries, markTrackers, buoyPositions } =
      _mapSequencedGeometries(
        data.MetasailBuoy,
        data.MetasailGate,
        data.MetasailPosition,
        race,
      );
    const boatPositions = _mapPositions(data.MetasailPosition, race);

    if (!boatPositions.length) {
      console.log(`positions not found for race = ${race.original_id}`);
      continue;
    }
    const rankings = _mapRankings(inputBoats, boatPositions);

    await saveCompetitionUnit({
      event,
      race: {
        id: race.id,
        original_id: race.original_id,
        name: race.name,
        url: race.url,
        scrapedUrl: race.url,
      },
      boats: inputBoats,
      positions: boatPositions,
      raceMetadata,
      courseSequencedGeometries,
      rankings,
      markTrackers,
      markTrackerPositions: buoyPositions,
      reuse: {
        event: true,
        boats: true,
      },
    });
  }
};

const _mapBoats = (boats = [], race) => {
  return boats
    .filter((t) => t.race_original_id === race.original_id)
    .map((b) => {
      const vessel = {
        id: b.id,
        publicName: b.name,
        globalId: b.sail_number,
        vesselId: b.original_id,
        model: b.class_name,
      };
      return vessel;
    });
};

const _mapPositions = (metasailPosition, race) => {
  if (!metasailPosition) {
    return [];
  }
  const positions = metasailPosition.filter(
    (t) => t.race_original_id === race.original_id && t.boat_original_id,
  );
  return positions
    .map((t) => {
      return {
        ...t,
        vesselId: t.boat,
        cog: t.orientation,
        sog: t.speed,
        windDirection: t.wind_direction,
        timestamp: +t.time * 1000,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
};

const _mapSequencedGeometries = (
  metasailBuoy = [],
  metasailGate = [],
  racePositions = [],
  race,
) => {
  const markTrackers = [];
  const buoyIdToMarkTrackerMap = {};
  metasailBuoy = metasailBuoy
    .filter((t) => t.race_original_id === race.original_id)
    .map((t) => {
      const id = uuidv4();
      buoyIdToMarkTrackerMap[t.id] = id;
      markTrackers.push({ id, name: t.name });
      return { ...t, markTrackerId: id };
    });

  const buoyPositions = racePositions
    .filter(
      (t) => t.buoy_original_id && t.race_original_id === race.original_id,
    )
    .map((t) => {
      return {
        ...t,
        markTrackerId: buoyIdToMarkTrackerMap[t.buoy],
        timestamp: +t.time * 1000,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const courseSequencedGeometries = [];
  let order = 1;
  metasailGate = metasailGate.filter(
    (t) => t.race_original_id === race.original_id,
  );
  for (const gate of metasailGate) {
    const bouy1FirstPosition = _findBuoyFirstPosition(
      gate.buoy_1,
      buoyPositions,
    );
    const bouy2FirstPosition = _findBuoyFirstPosition(
      gate.buoy_2,
      buoyPositions,
    );
    const bouy1 = metasailBuoy.find((t) => t.id === gate.buoy_1);
    const bouy2 = metasailBuoy.find((t) => t.id === gate.buoy_2);

    if (!bouy1FirstPosition || !bouy2FirstPosition || !bouy1 || !bouy2) {
      continue;
    }
    bouy1.used = true;
    bouy2.used = true;
    const name = [bouy1.name, bouy2.name].filter((t) => t).join(' ');
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryLine(
        {
          lat: bouy1FirstPosition.lat,
          lon: bouy1FirstPosition.lon,
          markTrackerId: bouy1.markTrackerId,
        },
        {
          lat: bouy2FirstPosition.lat,
          lon: bouy2FirstPosition.lon,
          markTrackerId: bouy2.markTrackerId,
        },
        {
          name,
        },
      ),
      order: order,
    });
  }

  for (const buoy of metasailBuoy) {
    if (buoy.used) {
      continue;
    }
    const firstPosition = _findBuoyFirstPosition(buoy.id, buoyPositions);
    courseSequencedGeometries.push({
      ...gisUtils.createGeometryPoint(
        {
          lat: firstPosition.lat,
          lon: firstPosition.lon,
          markTrackerId: buoy.markTrackerId,
        },
        {
          name: buoy.name,
        },
      ),
      order: order,
    });
    order++;
  }
  return {
    markTrackers,
    courseSequencedGeometries,
    buoyPositions,
  };
};
const _findBuoyFirstPosition = (id, buoyPositions) => {
  const position = buoyPositions.find((t) => t.buoy === id);
  return position;
};

const _mapRankings = (boats, positions = []) => {
  const rankings = [];

  for (const vessel of boats) {
    const ranking = { vesselId: vessel.id, elapsedTime: 0, finishTime: 0 };

    const allVesselPositions = positions.filter((t) => t.boat === vessel.id);
    if (!allVesselPositions.length) {
      rankings.push(ranking);
      continue;
    }
    const lastPosition = allVesselPositions[allVesselPositions.length - 1];
    const firstPosition = allVesselPositions[0];
    let elapsedTime = 0;
    let finishTime = 0;
    if (lastPosition && firstPosition) {
      elapsedTime = lastPosition.timestamp - firstPosition.timestamp;
      finishTime = lastPosition.timestamp;
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
module.exports = mapMetasailToSyrf;
