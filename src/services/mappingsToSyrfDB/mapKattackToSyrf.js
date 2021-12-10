const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');
  const race = data.KattackRace[0];
  if (!race || !data.KattackPosition) {
    console.log('No race or positions provided');
    return;
  }
  // vessels
  // boat type: 0 - participant, 1 - marks/buoys, 2 - committee boats or boat not included in race
  const deviceParticipants = [];
  const deviceMarks = [];
  data.KattackDevice?.forEach((d) => {
    if (d.type?.toString() === '1') {
      deviceMarks.push(d);
    } else {
      deviceParticipants.push(d);
    }
  });

  const inputBoats = _mapBoats(deviceParticipants);

  // positions
  const { participantPositions, markTrackerPositions, markTrackers } =
    _mapPositions(data.KattackPosition, deviceMarks);

  // marks
  const courseSequencedGeometries = _mapSequencedGeometries(
    data.KattackWaypoint,
    deviceMarks,
    markTrackers,
  );

  // Use different startTime because kattack startTime only contains date.
  raceMetadata.approx_start_time_ms = +race.race_start_time_utc
  raceMetadata.approx_end_time_ms = +race.race_start_time_utc + +(race.feed_length_sec*1000);

  // Hide the Kattack Race paradigm since their positions are absolute and cannot show in playback properly
  let event;
  if (race.original_paradigm === 'Race') {
    event = {
      isPrivate: true,
    }
  }

  await saveCompetitionUnit({
    event,
    race,
    boats: inputBoats,
    positions: participantPositions,
    raceMetadata,
    courseSequencedGeometries,
    markTrackers,
    markTrackerPositions,
    reuse: {
      boats: true,
    },
  });
};

const _mapBoats = (devices) => {
  return devices?.map((d) => ({
    id: d.id,
    publicName: d.name,
    vesselId: d.original_id,
    isCommittee: d.type?.toString() === '2', // type 2 boats are committee
  }));
};

const _mapPositions = (positions, deviceMarks) => {
  const participantPositions = [];
  const markTrackerPositions = [];
  const markTrackers = [];
  positions.forEach((p) => {
    const mappedPos = {
      timestamp: p.time,
      lon: p.lon,
      lat: p.lat,
      cog: p.heading_deg,
      sog: p.speed_kts,
      vesselId: p.device,
    };
    const mark = deviceMarks.find((m) => m.id === p.device);
    if (mark) {
      if (!markTrackers.find((mt) => mt.id === mark.id)) {
        markTrackers.push({
          id: mark.id,
        });
      }
      markTrackerPositions.push(mappedPos);
    } else {
      participantPositions.push(mappedPos);
    }
  });
  return {
    participantPositions,
    markTrackerPositions,
    markTrackers,
  };
};

const _mapSequencedGeometries = (waypoints, marks, markTrackers) => {
  const courseSequencedGeometries = [];
  let order = 0;
  waypoints?.forEach((w) => {
    const newPoint = createGeometryPoint({
      lat: w.lat,
      lon: w.lon,
      properties: {
        name: w.name,
      },
    });
    newPoint.id = w.id;
    newPoint.order = order;
    courseSequencedGeometries.push(newPoint);
    order++;
  });

  marks?.forEach((m) => {
    const newPoint = createGeometryPoint({
      lat: m.lat,
      lon: m.lon,
      properties: {
        name: m.name,
      },
    });
    newPoint.id = m.id;
    newPoint.order = order;
    courseSequencedGeometries.push(newPoint);
    order++;
    const markTracker = markTrackers.find((mt) => mt.id === m.id);
    if (markTracker) {
      markTracker.name = m.name;
    }
  });
  return courseSequencedGeometries;
};

module.exports = mapAndSave;
