const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const { iSailCombined, iSailPosition } = require('../schemas/parquets/iSail');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadUtil = require('../utils/uploadUtil');

const getParticipants = async (eventIDs) => {
  const participants = await db.iSailEventParticipant.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  participants.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getEventTrackData = async (eventIDs) => {
  const trackDatas = await db.iSailEventTracksData.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  trackDatas.forEach((row) => {
    result.set(row.event, row);
  });
  return result;
};
const getEventTracks = async (eventIDs) => {
  const tracks = await db.iSailTrack.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  tracks.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getRoundings = async (eventIDs) => {
  const roundings = await db.iSailRounding.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  roundings.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getRaces = async (eventIDs) => {
  const races = await db.iSailRace.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  races.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getMarks = async (eventIDs) => {
  const marks = await db.iSailMark.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  marks.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getStartlines = async (eventIDs) => {
  const startlines = await db.iSailStartline.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  startlines.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getCourseMarks = async (eventIDs) => {
  const courseMarks = await db.iSailCourseMark.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  courseMarks.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getResults = async (eventIDs) => {
  const sailResults = await db.iSailResult.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  sailResults.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};

const processISailData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('isail')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('isail_pos')).path;

  const events = await db.iSailEvent.findAll({ raw: true });
  if (events.length === 0) {
    return '';
  }

  const queryEventList = events.map((row) => row.id);
  const eventParticipants = await getParticipants(queryEventList);
  const eventTrackDatas = await getEventTrackData(queryEventList);
  const eventTracks = await getEventTracks(queryEventList);
  const roundings = await getRoundings(queryEventList);
  const races = await getRaces(queryEventList);
  const marks = await getMarks(queryEventList);
  const startlines = await getStartlines(queryEventList);
  const courseMarks = await getCourseMarks(queryEventList);
  const results = await getResults(queryEventList);

  const writer = await parquet.ParquetWriter.openFile(
    iSailCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < events.length; i++) {
    const {
      id: event_id,
      original_id: original_event_id,
      name,
      start_date,
      start_timezone_type,
      start_timezone,
      stop_date,
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
    } = events[i];

    await writer.appendRow({
      event_id,
      original_event_id,
      name,
      start_date,
      start_timezone_type,
      start_timezone,
      stop_date,
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
      participants: eventParticipants.get(event_id),
      trackData: eventTrackDatas.get(event_id),
      tracks: eventTracks.get(event_id),
      roundings: roundings.get(event_id),
      races: races.get(event_id),
      marks: marks.get(event_id),
      startlines: startlines.get(event_id),
      courseMarks: courseMarks.get(event_id),
      results: results.get(event_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    iSailPosition,
    positionPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < events.length; i++) {
    const { id: event } = events[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db.iSailPosition.findAll({
        where: { event },
        raw: true,
        offset: (page - 1) * perPage,
        limit: perPage,
      });
      pageSize = data.length;
      page++;
      while (data.length > 0) {
        await posWriter.appendRow(data.pop());
      }
    } while (pageSize === perPage);
  }
  await posWriter.close();

  const mainUrl = await uploadUtil.uploadFileToS3(
    parquetPath,
    `iSail/year=${currentYear}/month=${currentMonth}/isail_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `iSail/year=${currentYear}/month=${currentMonth}/isailPosition_${fullDateFormat}.parquet`,
  );

  if (!optionalPath) {
    fs.unlink(parquetPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Delete parqueted data from DB
  await db.iSailResult.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailCourseMark.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailStartline.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailMark.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailRace.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailRounding.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailEventTracksData.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailTrack.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailEventParticipant.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailPosition.destroy({
    where: { event: { [Op.in]: queryEventList } },
  });
  await db.iSailEvent.destroy({
    where: { id: { [Op.in]: queryEventList } },
  });

  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getParticipants,
  getEventTrackData,
  getEventTracks,
  getRoundings,
  getRaces,
  getMarks,
  getStartlines,
  getCourseMarks,
  getResults,
  processISailData,
};
