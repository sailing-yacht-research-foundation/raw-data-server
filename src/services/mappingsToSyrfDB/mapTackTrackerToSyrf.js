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
  const markTrackerPositions = _mapMarkTrackerPositions(
    data.TackTrackerPosition,
    markTrackers,
  );
  const courseSequencedGeometries = _mapSequencedGeometries(
    data.TackTrackerMark,
    data.TackTrackerStart,
    data.TackTrackerFinish,
    markTrackers,
    markTrackerPositions,
  );
  const positions = _mapPositions(
    data.TackTrackerPosition,
    data.TackTrackerRace[0],
  );

  const inputBoats = _mapBoats(data.TackTrackerBoat);

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
      timestamp: new Date(t.time).getTime(),
      race_id: t.race,
      race_original_id: tackTrackerRace.original_id,
      vesselId: t.boat,
      boat_original_id: t.boat,
    };
  });
  return newPositions;
};

const _mapMarkTrackerPositions = (positions, markTrackers) => {
  if (!markTrackers || !markTrackers.length) {
    return [];
  }
  const markTrackerIds = new Set(markTrackers.map((t) => t.id));
  const newPositions = positions.reduce((acc, t) => {
    if (markTrackerIds.has(t.boat)) {
      acc.push({
        ...t,
        timestamp: new Date(t.time).getTime(),
        markTrackerId: t.boat,
      });
    }
    return acc;
  }, []);
  return newPositions;
};

const _mapSequencedGeometries = (
  tackTrackerMark = [],
  tackTrackerStart = [],
  tackTrackerFinish = [],
  markTrackers = [],
  markTrackerPositions = [],
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
    const startMarkFirstPosition = _getFirstMarkPosition(
      startMarkTracker?.id,
      markTrackerPositions,
    );
    const startPinTracker = markTrackers.find(
      (t) => t.name === start.start_pin_name,
    );
    const startPinTrackerPosition = _getFirstMarkPosition(
      startPinTracker?.id,
      markTrackerPositions,
    );
    const newMark = createGeometryLine(
      {
        lat: startMarkFirstPosition?.lat || start.start_mark_lat,
        lon: startMarkFirstPosition?.lon || start.start_mark_lon,
        markTrackerId: startMarkTracker?.id,
      },
      {
        lat: startPinTrackerPosition?.lat || start.start_pin_lat,
        lon: startPinTrackerPosition?.lon || start.start_pin_lon,
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

      const markTrackerFirstPosition = _getFirstMarkPosition(
        markTracker?.id,
        markTrackerPositions,
      );
      const newMark = createGeometryPoint({
        lat: markTrackerFirstPosition?.lat || mark.lat,
        lon: markTrackerFirstPosition?.lon || mark.lon,
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

        const firstTrackerPosition = _getFirstMarkPosition(
          firstTracker?.id,
          markTrackerPositions,
        );
        const secondTrackerPosition = _getFirstMarkPosition(
          secondTracker?.id,
          markTrackerPositions,
        );
        const line = createGeometryLine(
          {
            lat: firstTrackerPosition?.lat || gates[0].lat,
            lon: firstTrackerPosition?.lon || gates[0].lon,
            markTrackerId: firstTracker?.id,
          },
          {
            lat: secondTrackerPosition?.lat || gates[1].lat,
            lon: secondTrackerPosition?.lon || gates[1].lon,
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

    const finishMarkTrackerPosition = _getFirstMarkPosition(
      finishMarkTracker?.id,
      markTrackerPositions,
    );

    const finishPinTrackerPosition = _getFirstMarkPosition(
      finishPinTracker?.id,
      markTrackerPositions,
    );
    const newMark = createGeometryLine(
      {
        lat: finishMarkTrackerPosition?.lat || finish.finish_mark_lat,
        lon: finishMarkTrackerPosition?.lon || finish.finish_mark_lon,
        markTrackerId: finishMarkTracker?.id,
      },
      {
        lat: finishPinTrackerPosition?.lat || finish.finish_pin_lat,
        lon: finishPinTrackerPosition?.lon || finish.finish_pin_lon,
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

const _getFirstMarkPosition = (markTrackerId, markTrackerPositions) => {
  if (!markTrackerId) {
    return null;
  }
  return markTrackerPositions.find((t) => t.markTrackerId === markTrackerId);
};
const _getNameWithoutDoubleQuote = (name) => {
  return name?.replace(/"/g, '');
};
module.exports = mapTackTrackerToSyrf;
