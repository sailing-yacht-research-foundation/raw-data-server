const { zonedTimeToUtc } = require('date-fns-tz');
const dataAccess = require('../../syrf-schema/dataAccess/v1/competitionUnit');
const vesselParticipantTrackJsonDAL = require('../../syrf-schema/dataAccess/v1/vesselParticipantTrackJson');
const competitionPointTrackJsonDAL = require('../../syrf-schema/dataAccess/v1/competitionPointTrackJson');
const competitionResultDAL = require('../../syrf-schema/dataAccess/v1/competitionResult');
const { createTransaction } = require('../../syrf-schema/utils/utils');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const db = require('../../syrf-schema/index');
const { uploadStreamToS3 } = require('../../services/s3Util');
const { Readable } = require('stream');

exports.upsert = async (
  id,
  {
    name,
    startTime,
    approximateStartLocation,
    approximateEndLocation,
    approximateStart,
    approximateStart_zone = 'Etc/UTC',
    boundingBox,
    vesselParticipantGroupId,
    courseId,
    calendarEventId,
    endTime,
    timeLimit,
    description,
    openGraphImage,
    country,
    city,
    status = competitionUnitStatus.COMPLETED,
    scrapedOriginalId,
    scrapedUrl,
    handicap,
  } = {},
  transaction,
) => {
  const now = Date.now();
  const competitionToSave = {
    name,
    startTime,
    approximateStartLocation,
    approximateEndLocation,
    isCompleted: true,
    boundingBox,
    vesselParticipantGroupId,
    courseId,
    calendarEventId,
    endTime,
    timeLimit,
    description,
    openGraphImage,
    country,
    city,
    status,
    scrapedOriginalId,
    scrapedUrl,
    handicap,
    createdAt: now,
    updatedAt: now,
  };

  const startDateObj = new Date(approximateStart);
  const approxStartTime = startDateObj.getTime();

  if (!isNaN(approxStartTime)) {
    competitionToSave.approximateStart = approximateStart;
    competitionToSave.approximateStart_zone = approximateStart_zone;
    competitionToSave.approximateStart_utc = zonedTimeToUtc(
      approxStartTime,
      approximateStart_zone,
    );
  } else {
    competitionToSave.approximateStart = null;
    competitionToSave.approximateStart_zone = null;
    competitionToSave.approximateStart_utc = null;
  }

  const result = await dataAccess.upsert(id, competitionToSave, transaction);
  return result;
};

/**
 * Stop the competition.
 * The logic is mostly taken from analysis engine.
 * Since the race already has the rankings.
 * That's why we take it out side instead of calculating the rankings like we do in the analysis engine.
 * @param {String} id competitionUnitId
 * @param {Map<String, VesselParticipantTrack>} vesselParticipantTracks vesselParticipantTracks
 * @param {Map<String, PointTrack>} pointTracks pointTracks
 * @param {Array<{vesselParticipantId:String, elapsedTime: Number, finishTime: Number}>} rankings rankings
 */
exports.stopCompetition = async (
  id,
  vesselParticipantTracks = {},
  pointTracks = {},
  rankings = [],
) => {
  console.log('Stopping Competition');
  const vesselTracksJson = await this.generateVesselTracksJson(
    id,
    vesselParticipantTracks,
  );
  const pointTracksJson = this.generatePointTracksJson(id, pointTracks);

  console.log('start triggerSaveFinishedCompetition');
  await this.triggerSaveFinishedCompetition(id, {
    vesselParticipantData: null,
    windData: {},
    geoJsons: { vesselTracksJson, pointTracksJson },
    rankings,
  });
};

exports.generateVesselTracksJson = async (
  competitionUnitId,
  vesselParticipantTracks = {},
) => {
  console.time('generateVesselTracksJson');
  const vesselTracksJson = [];
  // check vesselParticipantTrack.js for more detail
  for (const vesselParticipantId of Object.keys(vesselParticipantTracks)) {
    const label = `generateVesselTracksJson for vesselParticipantId = ${vesselParticipantId}, number of positions = ${vesselParticipantTracks[vesselParticipantId].positions.length}`;
    console.time(label);
    const geoJson = await vesselParticipantTracks[
      vesselParticipantId
    ].createGeoJsonTrack({ competitionUnitId });
    vesselTracksJson.push(geoJson);
    console.timeEnd(label);
  }
  console.timeEnd('generateVesselTracksJson');
  return vesselTracksJson;
};

exports.generatePointTracksJson = (competitionUnitId, pointTracks = {}) => {
  console.time('generatePointTracksJson');
  const pointTracksJson = [];
  // Check point track.js for detail logic
  for (const pointId of Object.keys(pointTracks)) {
    const geoJson = pointTracks[pointId].createGeoJsonTrack({
      competitionUnitId,
    });
    pointTracksJson.push(geoJson);
  }
  console.timeEnd('generatePointTracksJson');
  return pointTracksJson;
};

exports.triggerSaveFinishedCompetition = async (
  competitionUnitId,
  { geoJsons, rankings } = {},
) => {
  const { vesselTracksJson, pointTracksJson } = geoJsons;
  const bucket = process.env.AWS_S3_TRACKS_GEOJSON_BUCKET;
  console.time('uploadedVesselTrack');
  const uploadedVesselTrack = await Promise.all(
    vesselTracksJson.map(async (trackData) => {
      const { providedGeoJson, simplifiedGeoJson } = trackData;
      let providedS3Detail = null;
      try {
        const { uploadPromise, writeStream } = uploadStreamToS3(
          bucket,
          `individual-tracks/${competitionUnitId}/vessel/provided/${providedGeoJson.properties.vesselParticipantId}.geojson`,
        );
        Readable.from(JSON.stringify(providedGeoJson)).pipe(writeStream);
        providedS3Detail = await uploadPromise;
      } catch (error) {
        console.error(`Error uploading provided vessel track geojson:`);
        console.error(error);
      }

      let simplifiedS3Detail = null;
      try {
        const { uploadPromise, writeStream } = uploadStreamToS3(
          bucket,
          `individual-tracks/${competitionUnitId}/vessel/simplified/${simplifiedGeoJson.properties.vesselParticipantId}.geojson`,
        );
        Readable.from(JSON.stringify(simplifiedGeoJson)).pipe(writeStream);
        simplifiedS3Detail = await uploadPromise;
      } catch (error) {
        console.error(`Error uploading simplified vessel track geojson:`);
        console.error(error);
      }

      return {
        vesselParticipantId: providedGeoJson.properties.vesselParticipantId,
        providedStorageKey: providedS3Detail ? providedS3Detail.Key : '',
        simplifiedStorageKey: simplifiedS3Detail ? simplifiedS3Detail.Key : '',
      };
    }),
  );
  console.timeEnd('uploadedVesselTrack');
  console.time('uploadedPointTrack');
  const uploadedPointTrack = await Promise.all(
    pointTracksJson.map(async (trackData) => {
      let s3Detail = null;
      try {
        const { uploadPromise, writeStream } = uploadStreamToS3(
          bucket,
          `individual-tracks/${competitionUnitId}/point/${trackData.properties.pointId}.geojson`,
        );
        Readable.from(JSON.stringify(trackData)).pipe(writeStream);
        s3Detail = await uploadPromise;
      } catch (error) {
        console.error(`Error uploading point track geojson:`);
        console.error(error);
      }
      return {
        pointId: trackData.properties.pointId,
        storageKey: s3Detail ? s3Detail.Key : '',
      };
    }),
  );
  console.timeEnd('uploadedPointTrack');
  const transaction = await createTransaction();
  try {
    await this.saveVesselTrackJsons(
      competitionUnitId,
      uploadedVesselTrack.filter((row) => {
        return (
          row.calculatedStorageKey !== '' &&
          row.providedStorageKey !== '' &&
          row.simplifiedStorageKey !== ''
        );
      }),
      transaction,
    );
    await this.savePointTrackJsons(
      competitionUnitId,
      uploadedPointTrack.filter((row) => row.storageKey !== ''),
      transaction,
    );
    await this.saveCompetitionResult(
      competitionUnitId,
      rankings.map((rank, index) => {
        return {
          vesselParticipantId: rank.vesselParticipantId,
          finishTime: rank.finishTime, // TODO: What should be saved instead if the finishTime is zero (never finish)
          time: rank.elapsedTime,
          rank: index + 1,
        };
      }),
      transaction,
    );
    await transaction.commit();
    console.info(
      `Competition ${competitionUnitId} has been saved to permanent storage`,
    );
  } catch (error) {
    console.error(`Failed to save competition results. Error:'`);
    console.error(error);
    await transaction.rollback();
    // What should we do here? Store everything in a json file to try later?
    return false;
  }
};

exports.saveVesselTrackJsons = async (
  competitionUnitId,
  data = [],
  transaction,
) => {
  console.time('saveVesselTrackJsons');
  const dataToSave = data.map((row) => {
    const { vesselParticipantId, providedStorageKey, simplifiedStorageKey } =
      row;
    return {
      competitionUnitId,
      vesselParticipantId,
      providedStorageKey,
      calculatedStorageKey: '',
      simplifiedStorageKey,
    };
  });
  await vesselParticipantTrackJsonDAL.bulkCreate(dataToSave, transaction);
  console.timeEnd('saveVesselTrackJsons');
};

exports.savePointTrackJsons = async (
  competitionUnitId,
  data = [],
  transaction,
) => {
  console.time('savePointTrackJsons');
  const dataToSave = data.map((row) => {
    const { pointId, storageKey } = row;
    return {
      competitionUnitId,
      pointId,
      storageKey,
    };
  });
  await competitionPointTrackJsonDAL.bulkCreate(dataToSave, transaction);
  console.timeEnd('savePointTrackJsons');
};

exports.saveCompetitionResult = async (
  competitionUnitId,
  data = [],
  transaction,
) => {
  const dataToSave = data.map((row) => {
    const { vesselParticipantId, finishTime, time, rank } = row;
    return {
      competitionUnitId,
      vesselParticipantId,
      finishTime,
      time,
      rank,
    };
  });
  await competitionResultDAL.bulkCreate(dataToSave, transaction);
};
