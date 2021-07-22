const turf = require('@turf/turf');
const db = require('../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  allPositionsToFeatureCollection,
  findCenter,
} = require('../../utils/gisUtils');
const { uploadGeoJsonToS3 } = require('../uploadFileToS3');

const normalizeRace = async (
  { iSailRace, iSailPosition, iSailStartline, iSailEventParticipant, iSailTrack },
  transaction,
) => {
  const ISAIL_SOURCE = 'ISAIL';
  if (!iSailRace || !iSailPosition || iSailPosition.length === 0) {
    console.log('No race or positions so skipping.');
    return;
  }
  for (const index in iSailRace) {
    const race = iSailRace[index];
    const id = race.id;
    const name = race.name;
    const event = race.event;
    const url = race.url;
    const startTime = new Date(race.start * 1000).getTime();
    const endTime = new Date(race.stop * 1000).getTime();
    const raceTrackIds = race.track_ids;

    const racePositions = iSailPosition.filter((pos) => {
      const isPositionInTrack = raceTrackIds.includes(
          pos.original_track_id
      );
      if (isPositionInTrack) {
          let isPositionInRaceTime;
          const isAfterStart =
              pos.time >= race.start * 1000;
          const isBeforeEnd =
              pos.time <= race.stop * 1000;
          if (index === 0) {
              // include positions before start if race is earliest
              isPositionInRaceTime = isBeforeEnd;
          } else if (index === iSailRace.length - 1) {
              // include positions after end if race is latest
              isPositionInRaceTime = isAfterStart;
          } else {
              isPositionInRaceTime =
                  isAfterStart && isBeforeEnd;
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
        raceTrackIds.includes(t.original_id)
    );
    const raceParticipantIds = raceTracks.map(
        (t) => t.original_participant_id
    );
    const raceParticipants = iSailEventParticipant.filter((p) =>
        raceParticipantIds.includes(p.original_id)
    );
    const raceStartLines = iSailStartline?.filter(
        (s) => s.original_race_id === race.original_id
    );
    // Add the participantId in positions object for normalization
    racePositions.map((pos) => {
        const participantId = iSailTrack.find(
            (t) => t.id === pos.track
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

    const startObj = raceStartLines?.find((sl) => sl.name === 'start');
    const endObj = raceStartLines?.find((sl) => sl.name === 'finish');
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
      name,
      event,
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
    const tracksGeojson = JSON.stringify(
      allPositionsToFeatureCollection(boatsToSortedPositions),
    );

    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
    await uploadGeoJsonToS3(race.id, tracksGeojson, ISAIL_SOURCE, transaction);
  };
};

exports.normalizeRace = normalizeRace;