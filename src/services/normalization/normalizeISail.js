const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  findCenter,
} = require('../../utils/gisUtils');

const normalizeRace = async ({
  iSailEvent,
  iSailRace,
  iSailPosition,
  iSailStartline,
  iSailEventParticipant,
  iSailTrack,
}) => {
  const ISAIL_SOURCE = 'ISAIL';
  const raceMetadatas = [];
  if (!iSailRace || !iSailPosition?.length) {
    console.log('No race or positions so skipping.');
    return;
  }
  const event = iSailEvent?.[0];
  for (const index in iSailRace) {
    const race = iSailRace[index];
    const id = race.id;
    const url = race.url;
    const startTime = new Date(race.start * 1000).getTime();
    const endTime = new Date(race.stop * 1000).getTime();
    const raceTrackIds = race.track_ids;

    const racePositions = iSailPosition.filter((pos) => {
      const isPositionInTrack = raceTrackIds.includes(pos.original_track_id);
      if (isPositionInTrack) {
        let isPositionInRaceTime;
        const isAfterStart = pos.time >= race.start * 1000;
        const isBeforeEnd = pos.time <= race.stop * 1000;
        if (index === 0) {
          // include positions before start if race is earliest
          isPositionInRaceTime = isBeforeEnd;
        } else if (index === iSailRace.length - 1) {
          // include positions after end if race is latest
          isPositionInRaceTime = isAfterStart;
        } else {
          isPositionInRaceTime = isAfterStart && isBeforeEnd;
        }
        return isPositionInRaceTime;
      }
      return false;
    });
    if (racePositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const raceTracks = iSailTrack.filter((t) =>
      raceTrackIds.includes(t.original_id),
    );
    const raceParticipantIds = raceTracks.map((t) => t.original_participant_id);
    const raceParticipants = iSailEventParticipant.filter((p) =>
      raceParticipantIds.includes(p.original_id),
    );
    const raceStartLines = iSailStartline?.filter(
      (s) => s.original_race_id === race.original_id,
    );
    // Add the participantId in positions object for normalization
    racePositions.map((pos) => {
      const participantId = iSailTrack.find(
        (t) => t.id === pos.track,
      )?.participant;
      if (participantId) {
        pos.participant = participantId;
      }
      return pos;
    });

    const boundingBox = turf.bbox(
      positionsToFeatureCollection('lat', 'lon', racePositions),
    );
    racePositions.forEach((p) => {
      p.timestamp = p.time;
    });
    const boatsToSortedPositions = createBoatToPositionDictionary(
      racePositions,
      'participant',
      'time',
    );

    const startObj =
      raceStartLines?.find((sl) => sl.name === 'start') || raceStartLines?.[0];
    const endObj =
      raceStartLines?.find((sl) => sl.name === 'finish') || raceStartLines?.[0];
    let startPoint, endPoint;
    if (startObj) {
      startPoint = findCenter(
        startObj.lat_1,
        startObj.lon_1,
        startObj.lat_2,
        startObj.lon_2,
      );
    } else {
      const first3Positions = collectFirstNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    }
    if (endObj) {
      endPoint = findCenter(
        endObj.lat_1,
        endObj.lon_1,
        endObj.lat_2,
        endObj.lon_2,
      );
    } else {
      const last3Positions = collectLastNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
    }

    const boatNames = [];
    const boatModels = [];
    const handicapRules = [];
    const boatIdentifiers = [];
    const unstructuredText = [];
    raceParticipants?.forEach((b) => {
      boatNames.push(b.name);
      boatModels.push(b.class_name);
      boatIdentifiers.push(b.sail_no);
    });
    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    const raceMetadata = await createRace(
      id,
      race.name,
      event?.name,
      event?.id,
      ISAIL_SOURCE,
      url,
      startTime,
      endTime,
      startPoint,
      endPoint,
      boundingBox,
      roughLength,
      boatsToSortedPositions,
      boatNames,
      boatModels,
      boatIdentifiers,
      handicapRules,
      unstructuredText,
    );
    raceMetadatas.push(raceMetadata);
  }
  return raceMetadatas;
};

exports.normalizeRace = normalizeRace;
