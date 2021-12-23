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
    const starTimeObj = new Date(e.start * 1000);
    const stopTimeObj = new Date(e.end * 1000);
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      url: e.url,
      approxStartTimeMs: starTimeObj.getTime(),
      approxEndTimeMs: stopTimeObj.getTime(),
    };
  })[0];

  for (const race of data.MetasailRace) {
    const raceMetadata = raceMetadatas.find((t) => t.id === race.id);
    if (!raceMetadata) {
      console.log(`raceMetadata is not found for ${race.original_id}`);
      return;
    }

    const racePositions = data.MetasailPosition.filter(
      (t) => t.race_original_id === race.original_id,
    )
      .map((t) => ({ ...t, timestamp: +t.time * 1000 }))
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log('Saving to main database');
    const inputBoats = _mapBoats(data.MetasailBoat, race);

    const { courseSequencedGeometries, markTrackers, buoyPositions } =
      _mapSequencedGeometries(
        data.MetasailBuoy,
        data.MetasailGate,
        racePositions,
        race,
      );
    const positions = _mapPositions(
      racePositions.filter((t) => t.boat_original_id),
    );

    const rankings = _mapRankings(inputBoats, positions);

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
      positions,
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
        handicap: {},
      };
      return vessel;
    });
};

const _mapPositions = (positions) => {
  if (!positions) {
    return [];
  }
  return positions.map((t) => {
    return {
      ...t,
      vesselId: t.boat,
      cog: t.orientation,
      sog: t.speed,
      windDirection: t.wind_direction,
    };
  });
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
    .filter((t) => t.buoy_original_id)
    .map((t) => {
      return { ...t, markTrackerId: buoyIdToMarkTrackerMap[t.buoy] };
    });

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

  const reversePositions = positions.slice().reverse();
  for (const vessel of boats) {
    const ranking = { vesselId: vessel.id, elapsedTime: 0, finishTime: 0 };

    const lastPosition = reversePositions.find((t) => t.boat === vessel.id);
    const firstPosition = positions.find((t) => t.boat === vessel.id);
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
