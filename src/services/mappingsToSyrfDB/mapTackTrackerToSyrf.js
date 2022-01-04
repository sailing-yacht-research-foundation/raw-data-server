const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');
const mapTackTrackerToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapTackTrackerToSyrf requires raceMetadata`);
    return;
  }
  if (!data.TackTrackerRace?.length) {
    console.log(`mapTackTrackerToSyrf requires TracTracRace`);
    return;
  }
  // event
  const event = data.TackTrackerRegatta?.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      url: e.url,
    };
  })[0];

  console.log('Saving to main database');
  const inputBoats = _mapBoats(data.TackTrackerBoat);

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.TackTrackerMark,
    data.TackTrackerStart,
    data.TackTrackerFinish,
  );
  const positions = _mapPositions(
    data.TackTrackerPosition,
    data.TackTrackerRace[0],
  );

  const rankings = _mapRankings(inputBoats, positions);

  const race = data.TackTrackerRace[0];
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
    reuse: {
      event: true,
    },
  });
};

const _mapBoats = (boats) => {
  return boats?.map((b) => {
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.id,
    };
    return vessel;
  });
};

const _mapPositions = (positions, tackTrackerRace) => {
  if (!positions) {
    return [];
  }
  const newPositions = positions.map((t) => {
    return {
      ...t,
      timestamp: new Date(t.time),
      race_id: t.race,
      race_original_id: tackTrackerRace.original_id,
      vesselId: t.boat,
      boat_original_id: t.boat,
    };
  });

  newPositions.sort((a, b) => a.timestamp - b.timestamp);
  return newPositions;
};

const _mapSequencedGeometries = (
  tackTrackerMark = [],
  tackTrackerStart = [],
  tackTrackerFinish = [],
) => {
  const courseSequencedGeometries = [];
  let order = 1;

  for (const start of tackTrackerStart) {
    const newMark = createGeometryLine(
      {
        lat: start.start_mark_lat,
        lon: start.start_mark_lon,
      },
      {
        lat: start.start_pin_lat,
        lon: start.start_pin_lon,
      },
      { name: start.start_mark_name },
    );
    newMark.order = order;
    courseSequencedGeometries.push(newMark);
    order++;
  }
  for (const mark of tackTrackerMark) {
    if (mark.used) {
      continue;
    }
    if (mark.type === 'Rounding') {
      const newMark = createGeometryPoint({
        lat: mark.lat,
        lon: mark.lon,
        properties: {
          name: mark.name,
          type: mark.type,
        },
      });
      newMark.order = order;
      courseSequencedGeometries.push(newMark);
      order++;
    } else if (mark.type === 'GateMark') {
      // we will always have 3 gate mark here
      // For example: for a start it will be like this.
      // [
      //   {"name": "\"Start\"", "type": "Start"},
      //   { "name": "\"Start\"", "type": "GateMark"},
      //   { "name": "\"Start\"", "type": "GateMark"}
      // ]
      // That's why we filter by type === 'GateMark' to make gate.lengths === 2
      const gates = tackTrackerMark.filter(
        (t) => t.name === mark.name && !t.used && t.type === 'GateMark',
      );
      if (gates.length === 2) {
        const line = createGeometryLine(
          {
            lat: gates[0].lat,
            lon: gates[0].lon,
          },
          {
            lat: gates[1].lat,
            lon: gates[1].lon,
          },
          { name: mark.name },
        );
        gates.forEach((t) => (t.used = true));
        courseSequencedGeometries.push(line);
      }
      order++;
    }
  }
  for (const finish of tackTrackerFinish) {
    const newMark = createGeometryLine(
      {
        lat: finish.finish_mark_lat,
        lon: finish.finish_mark_lon,
      },
      {
        lat: finish.finish_pin_lat,
        lon: finish.finish_pin_lon,
      },
      { name: finish.finish_mark_name },
    );
    newMark.order = order;
    courseSequencedGeometries.push(newMark);
    order++;
  }

  return courseSequencedGeometries;
};

const _mapRankings = (boats, positions = []) => {
  if (!boats) {
    return [];
  }
  const rankings = [];
  for (const vessel of boats) {
    const ranking = { vesselId: vessel.id };
    const boatPositions = positions.filter((t) => t.boat === vessel.id);

    let elapsedTime = 0;
    let finishTime = 0;
    if (boatPositions.length) {
      const firstPosition = boatPositions[0];
      const lastPosition = boatPositions[boatPositions.length - 1];
      elapsedTime =
        lastPosition.timestamp.getTime() - firstPosition.timestamp.getTime();
      finishTime = lastPosition.timestamp.getTime();
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
module.exports = mapTackTrackerToSyrf;
