const { zonedTimeToUtc } = require('date-fns-tz');
const dataAccess = require('../../syrf-schema/dataAccess/v1/competitionUnit');
const { createTransaction } = require('../../syrf-schema/utils/utils');
const db = require('../../syrf-schema/index');
const { uploadStreamToS3 } = require('../../services/s3Util');
const { Readable } = require('stream');
const {
  setCreateMeta,
  setUpdateMeta,
} = require('../../syrf-schema/utils/utils');

exports.upsert = async (
  id,
  {
    name,
    startTime,
    approximateStart,
    approximateStart_zone = 'Etc/UTC',
    isCompleted,
    boundingBox,
    vesselParticipantGroupId,
    courseId,
    calendarEventId,
    endTime,
    timeLimit,
    description,
  } = {},
  user,
  transaction,
) => {
  const isNew = !id;

  let res = await dataAccess.getById(id);

  if (id && !res) {
    throw new Error('Competition Unit not found');
  }

  if (isNew) {
    res = setCreateMeta(res, user);
  }

  const startDateObj = new Date(approximateStart);

  if (!isNaN(startDateObj.getTime())) {
    res.approximateStart = approximateStart;
    res.approximateStart_zone = approximateStart_zone;
    res.approximateStart_utc = zonedTimeToUtc(
      startDateObj,
      approximateStart_zone,
    );
  } else {
    res.approximateStart = null;
    res.approximateStart_zone = null;
    res.approximateStart_utc = null;
  }

  res.name = name;
  res.startTime = startTime;
  res.approximateStart = approximateStart;
  res.isCompleted = isCompleted;
  res.boundingBox = boundingBox;
  res.vesselParticipantGroupId = vesselParticipantGroupId;
  res.courseId = courseId;
  res.calendarEventId = calendarEventId;
  res.endTime = endTime;
  res.timeLimit = timeLimit;
  res.description = description;

  res = setUpdateMeta(res, user);
  const result = await dataAccess.upsert(id, res, transaction);
  return result;
};

exports.getAll = async (paging, calendarEventId) => {
  return await dataAccess.getAll(paging, calendarEventId);
};

exports.getById = async (id, calendarEventId) => {
  let result = await dataAccess.getById(id);

  if (!result) {
    throw new Error('Competition Unit not found');
  }
  if (calendarEventId && result.calendarEventId !== calendarEventId) {
    throw new Error('Calendar Event not found');
  }

  return result;
};

exports.delete = async (id, calendarEventId) => {
  let result = await dataAccess.getById(id);

  if (!result) {
    throw new Error('Competition Unit not found');
  }
  if (calendarEventId && result.calendarEventId !== calendarEventId) {
    throw new Error('Calendar Event not found');
  }

  await dataAccess.delete(id);

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
  const vesselTracksJson = this.generateVesselTracksJson(
    id,
    vesselParticipantTracks,
  );
  const pointTracksJson = this.generatePointTracksJson(id, pointTracks);
  await this.triggerSaveFinishedCompetition(id, {
    vesselParticipantData: null,
    windData: {},
    geoJsons: { vesselTracksJson, pointTracksJson },
    rankings,
  });
};

exports.generateVesselTracksJson = (
  competitionUnitId,
  vesselParticipantTracks = {},
) => {
  const vesselTracksJson = [];
  // check vesselParticipantTrack.js for more detail
  for (const vesselParticipantId of Object.keys(vesselParticipantTracks)) {
    const geoJson = vesselParticipantTracks[
      vesselParticipantId
    ].createGeoJsonTrack({ competitionUnitId });
    vesselTracksJson.push(geoJson);
  }
  return vesselTracksJson;
};

exports.generatePointTracksJson = (competitionUnitId, pointTracks = {}) => {
  const pointTracksJson = [];
  // Check point track.js for detail logic
  for (const pointId of Object.keys(pointTracks)) {
    const geoJson = pointTracks[pointId].createGeoJsonTrack({
      competitionUnitId,
    });
    pointTracksJson.push(geoJson);
  }
  return pointTracksJson;
};

exports.triggerSaveFinishedCompetition = async (
  competitionUnitId,
  { geoJsons, rankings } = {},
) => {
  const { vesselTracksJson, pointTracksJson } = geoJsons;
  const bucket = process.env.AWS_S3_TRACKS_GEOJSON_BUCKET;
  const uploadedVesselTrack = await Promise.all(
    vesselTracksJson.map(async (trackData) => {
      const { calculatedGeoJson, providedGeoJson, simplifiedGeoJson } =
        trackData;
      let calculatedS3Detail = null;
      try {
        const { uploadPromise, writeStream } = uploadStreamToS3(
          bucket,
          `individual-tracks/${competitionUnitId}/vessel/calculated/${calculatedGeoJson.properties.vesselParticipantId}.geojson`,
        );
        Readable.from(JSON.stringify(calculatedGeoJson)).pipe(writeStream);
        calculatedS3Detail = await uploadPromise;
      } catch (error) {
        console.error(`Error uploading calculated vessel track geojson:`);
        console.error(error);
      }

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
        vesselParticipantId: calculatedGeoJson.properties.vesselParticipantId,
        calculatedStorageKey: calculatedS3Detail ? calculatedS3Detail.Key : '',
        providedStorageKey: providedS3Detail ? providedS3Detail.Key : '',
        simplifiedStorageKey: simplifiedS3Detail ? simplifiedS3Detail.Key : '',
      };
    }),
  );
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
          finishTime: rank.finishTime || new Date().getTime(), // TODO: What should be saved instead if the finishTime is zero (never finish)
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
  const dataToSave = data.map((row) => {
    const {
      vesselParticipantId,
      providedStorageKey,
      calculatedStorageKey,
      simplifiedStorageKey,
    } = row;
    return {
      competitionUnitId,
      vesselParticipantId,
      providedStorageKey,
      calculatedStorageKey,
      simplifiedStorageKey,
    };
  });
  await db.VesselParticipantTrackJson.bulkCreate(dataToSave, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
};

exports.savePointTrackJsons = async (
  competitionUnitId,
  data = [],
  transaction,
) => {
  const dataToSave = data.map((row) => {
    const { pointId, storageKey } = row;
    return {
      competitionUnitId,
      pointId,
      storageKey,
    };
  });
  await db.CompetitionPointTrackJson.bulkCreate(dataToSave, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
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
  await db.CompetitionResult.bulkCreate(dataToSave, {
    ignoreDuplicates: true,
    validate: true,
    transaction,
  });
};
