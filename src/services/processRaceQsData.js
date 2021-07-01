const fs = require('fs');
const temp = require('temp');

const db = require('../models');
const Op = db.Sequelize.Op;
const { raceQsCombined } = require('../schemas/parquets/raceQs');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getRegattas = async () => {
  const regattas = await db.raceQsRegatta.findAll({ raw: true });
  const mapRegatta = new Map();
  regattas.forEach((row) => {
    mapRegatta.set(row.id, row);
  });
  return mapRegatta;
};
const getEvents = async () => {
  const events = await db.raceQsEvent.findAll({ raw: true });
  return events;
};
const getDivisions = async (eventList) => {
  const divisions = await db.raceQsDivision.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  divisions.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getParticipants = async (eventList) => {
  const participants = await db.raceQsParticipant.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  participants.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getPositions = async (eventList) => {
  const positions = await db.raceQsPosition.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  positions.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getRoutes = async (eventList) => {
  const routes = await db.raceQsRoute.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  routes.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getStarts = async (eventList) => {
  const starts = await db.raceQsStart.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  starts.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getWaypoints = async (eventList) => {
  const waypoints = await db.raceQsWaypoint.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  waypoints.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const processRaceQsData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath;
  if (!optionalPath) {
    parquetPath = (await temp.open('raceqs')).path;
  }

  const events = await getEvents();
  if (events.length === 0) {
    return '';
  }
  const eventList = events.map((row) => row.id);

  const mapRegatta = await getRegattas();
  const divisions = await getDivisions(eventList);
  const participants = await getParticipants(eventList);
  const positions = await getPositions(eventList);
  const routes = await getRoutes(eventList);
  const starts = await getStarts(eventList);
  const waypoints = await getWaypoints(eventList);

  const data = events.map((row) => {
    const {
      id: event_id,
      original_id: event_original_id,
      regatta,
      regatta_original_id,
      name,
      content,
      from,
      till,
      tz,
      lat1,
      lon1,
      lat2,
      lon2,
      updated_at,
      url,
    } = row;

    return {
      event_id,
      event_original_id,
      regatta,
      regatta_original_id,
      regatta_data: mapRegatta.get(regatta),
      name,
      content,
      from,
      till,
      tz,
      lat1,
      lon1,
      lat2,
      lon2,
      updated_at,
      url,
      divisions: divisions.get(event_id),
      participants: participants.get(event_id),
      positions: positions.get(event_id),
      routes: routes.get(event_id),
      starts: starts.get(event_id),
      waypoints: waypoints.get(event_id),
    };
  });
  await writeToParquet(data, raceQsCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `raceqs/year=${currentYear}/month=${currentMonth}/raceqs_${fullDateFormat}.parquet`,
  );
  if (!optionalPath) {
    fs.unlink(parquetPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  return fileUrl;
};

module.exports = {
  getRegattas,
  getEvents,
  getDivisions,
  getParticipants,
  getPositions,
  getRoutes,
  getStarts,
  getWaypoints,
  processRaceQsData,
};
