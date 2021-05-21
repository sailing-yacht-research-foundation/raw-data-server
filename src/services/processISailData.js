const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { iSailCombined } = require('../schemas/parquets/iSail');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

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
const getPositions = async (eventIDs) => {
  const positions = await db.iSailPosition.findAll({
    where: { event: { [Op.in]: eventIDs } },
    raw: true,
  });
  const result = new Map();
  positions.forEach((row) => {
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

const processISailData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-isail');

  const combinedPath = `${dirPath}/iSailCombined.parquet`;
  const events = await db.iSailEvent.findAll({ raw: true });
  if (events.length === 0) {
    return '';
  }

  const queryEventList = events.map((row) => row.id);
  const eventParticipants = await getParticipants(queryEventList);
  const eventTrackDatas = await getEventTrackData(queryEventList);
  const eventTracks = await getEventTracks(queryEventList);
  const positions = await getPositions(queryEventList);
  const roundings = await getRoundings(queryEventList);
  const races = await getRaces(queryEventList);
  const marks = await getMarks(queryEventList);
  const startlines = await getStartlines(queryEventList);
  const courseMarks = await getCourseMarks(queryEventList);
  const results = await getResults(queryEventList);
  const eventData = events.map((row) => {
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
    } = row;
    return {
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
      participants: JSON.stringify(eventParticipants.get(event_id)),
      trackData: JSON.stringify(eventTrackDatas.get(event_id)),
      tracks: JSON.stringify(eventTracks.get(event_id)),
      positions: JSON.stringify(positions.get(event_id)),
      roundings: JSON.stringify(roundings.get(event_id)),
      races: JSON.stringify(races.get(event_id)),
      marks: JSON.stringify(marks.get(event_id)),
      startlines: JSON.stringify(startlines.get(event_id)),
      courseMarks: JSON.stringify(courseMarks.get(event_id)),
      results: JSON.stringify(results.get(event_id)),
    };
  });
  await writeToParquet(eventData, iSailCombined, combinedPath);
  const fileUrl = await uploadFileToS3(
    combinedPath,
    `iSail/year=${currentYear}/month=${currentMonth}/isail_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = {
  getParticipants,
  getEventTrackData,
  getEventTracks,
  getPositions,
  getRoundings,
  getRaces,
  getMarks,
  getStartlines,
  getCourseMarks,
  getResults,
  processISailData,
};
