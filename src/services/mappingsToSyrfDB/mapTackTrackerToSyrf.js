const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const markIdentifiers = new Set(['Mark', 'Marker', 'CourseMark']);

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
  let event = data.TackTrackerRegatta?.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id,
      url: e.url,
    };
  })[0];

  if (!event && data.TackTrackerRace[0].user) {
    event = data.TackTrackerRace?.map((e) => {
      return {
        id: e.id,
        original_id: e.user_original_id,
        url: e.url,
      };
    })[0];
  }

  console.log('Saving to main database');
  const markTrackers = _mapTracker(data.TackTrackerBoat);
  const courseSequencedGeometries = _mapSequencedGeometries(
    data.TackTrackerMark,
    data.TackTrackerStart,
    data.TackTrackerFinish,
    markTrackers,
  );
  const markTrackerPositions = _mapMarkTrackerPositions(
    data.TackTrackerPosition,
    markTrackers,
  );

  const positions = _mapPositions(
    data.TackTrackerPosition,
    data.TackTrackerRace[0],
  );

  const inputBoats = _mapBoats(data.TackTrackerBoat);
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
    markTrackers,
    markTrackerPositions,
    courseSequencedGeometries,
    rankings,
    reuse: {
      event: true,
    },
  });
};

const _mapBoats = (boats) => {
  const inputBoats = [];

  for (const b of boats) {
    if (markIdentifiers.has(b.unknown_4)) {
      continue;
    }
    const vessel = {
      id: b.id,
      publicName: b.name,
      vesselId: b.id,
      model: b.unknown_4,
      isCommittee: b.unknown_4 === 'Spectator',
    };
    inputBoats.push(vessel);
  }

  return inputBoats;
};

const _mapTracker = (trackerData) => {
  const markTrackers = [];
  for (const tracker of trackerData) {
    if (!markIdentifiers.has(tracker.unknown_4)) {
      continue;
    }
    markTrackers.push(tracker);
  }
  return markTrackers;
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

const _mapMarkTrackerPositions = (positions, markTrackers) => {
  if (!markTrackers || !markTrackers.length) {
    return [];
  }
  const markTrackerIds = new Set(markTrackers.map((t) => t.id));
  const newPositions = positions
    .map((t) => {
      if (!markTrackerIds.has(t.boat)) {
        return null;
      }
      return {
        ...t,
        timestamp: new Date(t.time),
        markTrackerId: t.boat,
      };
    })
    .filter((t) => t);

  newPositions.sort((a, b) => a.timestamp - b.timestamp);
  return newPositions;
};

const _mapSequencedGeometries = (
  tackTrackerMark = [],
  tackTrackerStart = [],
  tackTrackerFinish = [],
  markTrackers = [],
) => {
  const courseSequencedGeometries = [];
  let order = 1;

  // filter out the finish lines which is the same as start line
  const finishPinWithStartPinType = tackTrackerFinish.filter(
    (t) => t.finish_pin_type === 'StartPin',
  );

  tackTrackerFinish = tackTrackerFinish.filter(
    (t) => t.finish_pin_type !== 'StartPin',
  );
  for (const start of tackTrackerStart) {
    const finishMark = finishPinWithStartPinType.find(
      (t) =>
        t.finish_mark_lat === start.start_mark_lat &&
        t.finish_mark_lon === start.start_mark_lon &&
        t.finish_pin_lat === start.start_pin_lat &&
        t.finish_pin_lon === start.start_pin_lon,
    );

    let startMarkName = start.start_mark_name;

    if (finishMark && finishMark.finish_mark_name !== start.start_mark_name) {
      startMarkName = `${start.start_mark_name} - ${finishMark.finish_mark_name}`;
    }
    const startMarkTracker = markTrackers.find(
      (t) => t.name === start.start_mark_name,
    );
    const startPinTracker = markTrackers.find(
      (t) => t.name === start.start_pin_name,
    );
    const newMark = createGeometryLine(
      {
        lat: start.start_mark_lat,
        lon: start.start_mark_lon,
        markTrackerId: startMarkTracker?.id,
      },
      {
        lat: start.start_pin_lat,
        lon: start.start_pin_lon,
        markTrackerId: startPinTracker?.id,
      },
      { name: startMarkName },
    );
    newMark.order = order;
    courseSequencedGeometries.push(newMark);
    order++;
  }
  tackTrackerMark = tackTrackerMark.filter((t) => t.lat && t.lon);
  for (const mark of tackTrackerMark) {
    if (mark.used) {
      continue;
    }
    if (mark.type === 'Rounding' || mark.type === 'Fixed' || !mark.type) {
      const markTracker = markTrackers.find(
        (t) =>
          _getNameWithoutDoubleQuote(t.name) ===
          _getNameWithoutDoubleQuote(mark.name),
      );
      const newMark = createGeometryPoint({
        lat: mark.lat,
        lon: mark.lon,
        properties: {
          name: mark.name,
          type: mark.type,
        },
        markTrackerId: markTracker?.id,
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
        const firstTracker = markTrackers.find(
          (t) =>
            _getNameWithoutDoubleQuote(t.name) ===
            _getNameWithoutDoubleQuote(gates[0].name),
        );
        const secondTracker = markTrackers.find(
          (t) =>
            _getNameWithoutDoubleQuote(t.name) ===
            _getNameWithoutDoubleQuote(gates[1].name),
        );
        const line = createGeometryLine(
          {
            lat: gates[0].lat,
            lon: gates[0].lon,
            markTrackerId: firstTracker?.id,
          },
          {
            lat: gates[1].lat,
            lon: gates[1].lon,
            markTrackerId: secondTracker?.id,
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
    const finishMarkTracker = markTrackers.find(
      (t) => t.name === finish.finish_mark_name,
    );
    const finishPinTracker = markTrackers.find(
      (t) => t.name === finish.finish_pin_name,
    );
    const newMark = createGeometryLine(
      {
        lat: finish.finish_mark_lat,
        lon: finish.finish_mark_lon,
        markTrackerId: finishMarkTracker?.id,
      },
      {
        lat: finish.finish_pin_lat,
        lon: finish.finish_pin_lon,
        markTrackerId: finishPinTracker?.id,
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

const _getNameWithoutDoubleQuote = (name) => {
  return name?.replace(/"/g, '');
};
module.exports = mapTackTrackerToSyrf;
