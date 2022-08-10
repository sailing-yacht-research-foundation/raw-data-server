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
  return await saveCompetitionUnit({
    event,
    race: {
      id: race.id,
      original_id: race.original_id,
      name: race.name,
      description: [race.type, race.course, race.event_notes, race.course_notes]
        .filter(Boolean)
        .join('\n')
        .substr(0, 1000),
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
      deckColor: b.color,
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
    const lat1 = start.start_mark_lat ?? startMarkFirstPosition?.lat;
    const lon1 = start.start_mark_lon ?? startMarkFirstPosition?.lon;
    const lat2 = start.start_pin_lat ?? startPinTrackerPosition?.lat;
    const lon2 = start.start_pin_lon ?? startPinTrackerPosition?.lon;
    const isPoint1Valid =
      lat1 !== null && lon1 != null && !isNaN(lat1) && !isNaN(lon1);
    const isPoint2Valid =
      lat2 !== null && lon2 != null && !isNaN(lat2) && !isNaN(lon2);
    if (isPoint1Valid && isPoint2Valid) {
      const newMark = createGeometryLine(
        {
          lat: +lat1,
          lon: +lon1,
          markTrackerId: startMarkTracker?.id,
          properties: {
            name: start.start_mark_name,
          },
        },
        {
          lat: +lat2,
          lon: +lon2,
          markTrackerId: startPinTracker?.id,
          properties: {
            name: start.start_pin_name,
          },
        },
        { name: startMarkName },
      );
      newMark.order = order;
      courseSequencedGeometries.push(newMark);
      order++;
    }
  }
  tackTrackerMark = tackTrackerMark.filter((t) => t.lat && t.lon);
  for (const markIndex in tackTrackerMark) {
    const mark = tackTrackerMark[markIndex];
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
      const lat = mark.lat ?? markTrackerFirstPosition?.lat;
      const lon = mark.lon ?? markTrackerFirstPosition?.lon;
      if (lat !== null && lon != null && !isNaN(lat) && !isNaN(lon)) {
        const newMark = createGeometryPoint({
          lat: +lat,
          lon: +lon,
          properties: {
            name: mark.name,
            type: mark.type,
          },
          markTrackerId: markTracker?.id,
        });
        newMark.order = order;
        courseSequencedGeometries.push(newMark);
        order++;
      }
    } else if (mark.type === 'GateMark' || mark.type === 'GateMarkCenter') {
      /*
        we will always have 3 gate mark here
        For example: for a start it will be like this.
        [
          {"name": "\"Start\"", "type": "Start"},
          { "name": "\"Start\"", "type": "GateMark"},
          { "name": "\"Start\"", "type": "GateMark"}
        ]
        That's why we filter by type === 'GateMark' to make gate.lengths === 2

        For GateMarkCenter, its name is the concatenation of 2 GateMark separated by dash (-)
        [
          {"name": "\"gate-4\"", "type": "GateMarkCenter"},
          { "name": "\"gate\"", "type": "GateMark"},
          { "name": "\"4\"", "type": "GateMark"}
        ]
       */
      let gates;
      if (mark.type === 'GateMark') {
        gates = tackTrackerMark.filter(
          (t) => t.name === mark.name && !t.used && t.type === 'GateMark',
        );
      } else {
        const gateNames = _getNameWithoutDoubleQuote(mark.name).split('-');
        gates = tackTrackerMark
          .slice(markIndex)
          .filter(
            (t) =>
              gateNames.includes(_getNameWithoutDoubleQuote(t.name)) &&
              !t.used &&
              t.type === 'GateMark',
          );
      }
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
        const lat1 = firstTrackerPosition?.lat ?? gates[0].lat;
        const lon1 = firstTrackerPosition?.lon ?? gates[0].lon;
        const lat2 = secondTrackerPosition?.lat ?? gates[1].lat;
        const lon2 = secondTrackerPosition?.lon ?? gates[1].lon;
        const isPoint1Valid =
          lat1 !== null && lon1 != null && !isNaN(lat1) && !isNaN(lon1);
        const isPoint2Valid =
          lat2 !== null && lon2 != null && !isNaN(lat2) && !isNaN(lon2);
        if (isPoint1Valid && isPoint2Valid) {
          const line = createGeometryLine(
            {
              lat: +lat1,
              lon: +lon1,
              markTrackerId: firstTracker?.id,
              properties: {
                name: firstTracker?.name,
              },
            },
            {
              lat: +lat2,
              lon: +lon2,
              markTrackerId: secondTracker?.id,
              properties: {
                name: secondTracker?.name,
              },
            },
            { name: mark.name },
          );
          gates.forEach((t) => (t.used = true));
          line.order = order;
          courseSequencedGeometries.push(line);
        }
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
    const lat1 = finish.finish_mark_lat ?? finishMarkTrackerPosition?.lat;
    const lon1 = finish.finish_mark_lon ?? finishMarkTrackerPosition?.lon;
    const lat2 = finish.finish_pin_lat ?? finishPinTrackerPosition?.lat;
    const lon2 = finish.finish_pin_lon ?? finishPinTrackerPosition?.lon;
    const isPoint1Valid =
      lat1 !== null && lon1 != null && !isNaN(lat1) && !isNaN(lon1);
    const isPoint2Valid =
      lat2 !== null && lon2 != null && !isNaN(lat2) && !isNaN(lon2);
    if (isPoint1Valid && isPoint2Valid) {
      const newMark = createGeometryLine(
        {
          lat: +lat1,
          lon: +lon1,
          markTrackerId: finishMarkTracker?.id,
          properties: {
            name: finish.finish_mark_name,
          },
        },
        {
          lat: +lat2,
          lon: +lon2,
          markTrackerId: finishPinTracker?.id,
          properties: {
            name: finish.finish_pin_name,
          },
        },
        { name: finish.finish_mark_name },
      );
      newMark.order = order;
      courseSequencedGeometries.push(newMark);
      order++;
    }
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
