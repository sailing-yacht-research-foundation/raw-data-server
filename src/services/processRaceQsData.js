const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  raceQsCombined,
  raceQsPosition,
} = require('../schemas/parquets/raceQs');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadUtil = require('../utils/uploadUtil');

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

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('raceqs')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('raceqs_pos')).path;

  const events = await getEvents();
  if (events.length === 0) {
    return '';
  }
  const eventList = events.map((row) => row.id);

  const mapRegatta = await getRegattas();
  const divisions = await getDivisions(eventList);
  const participants = await getParticipants(eventList);
  const routes = await getRoutes(eventList);
  const starts = await getStarts(eventList);
  const waypoints = await getWaypoints(eventList);

  const writer = await parquet.ParquetWriter.openFile(
    raceQsCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < events.length; i++) {
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
    } = events[i];

    await writer.appendRow({
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
      routes: routes.get(event_id),
      starts: starts.get(event_id),
      waypoints: waypoints.get(event_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    raceQsPosition,
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
      const data = await db.raceQsPosition.findAll({
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
    `raceqs/year=${currentYear}/month=${currentMonth}/raceqs_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `raceqs/year=${currentYear}/month=${currentMonth}/raceqsPosition_${fullDateFormat}.parquet`,
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
  await db.raceQsWaypoint.destroy({
    where: { event: { [Op.in]: eventList } },
  });
  await db.raceQsStart.destroy({
    where: { event: { [Op.in]: eventList } },
  });
  await db.raceQsRoute.destroy({
    where: { event: { [Op.in]: eventList } },
  });
  await db.raceQsParticipant.destroy({
    where: { event: { [Op.in]: eventList } },
  });
  await db.raceQsDivision.destroy({
    where: { event: { [Op.in]: eventList } },
  });
  await db.raceQsPosition.destroy({
    where: { event: { [Op.in]: eventList } },
  });
  const regattaIDs = [];
  mapRegatta.forEach((row) => {
    regattaIDs.push(row.id);
  });
  await db.raceQsRegatta.destroy({
    where: { id: { [Op.in]: regattaIDs } },
  });
  await db.raceQsEvent.destroy({
    where: { id: { [Op.in]: eventList } },
  });

  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRegattas,
  getEvents,
  getDivisions,
  getParticipants,
  getRoutes,
  getStarts,
  getWaypoints,
  processRaceQsData,
};
