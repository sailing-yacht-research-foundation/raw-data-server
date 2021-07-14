const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  kwindooCombined,
  kwindooPosition,
} = require('../schemas/parquets/kwindoo');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');

const getRegattas = async () => {
  const regattas = await db.kwindooRegatta.findAll({ raw: true });
  return regattas;
};
const getRegattaOwners = async () => {
  const owners = await db.kwindooRegattaOwner.findAll({ raw: true });
  const mapOwner = new Map();
  owners.forEach((row) => {
    mapOwner.set(row.id, row);
  });
  return mapOwner;
};
const getRaces = async (regattaList) => {
  const races = await db.kwindooRace.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  races.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getBoats = async (regattaList) => {
  const boats = await db.kwindooBoat.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  boats.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getComments = async (regattaList) => {
  const comments = await db.kwindooComment.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  comments.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getHomeportLocations = async (regattaList) => {
  const homeportLocations = await db.kwindooHomeportLocation.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  homeportLocations.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getMarkers = async (regattaList) => {
  const markers = await db.kwindooMarker.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  markers.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getMIAs = async (regattaList) => {
  const mias = await db.kwindooMIA.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  mias.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getPOIs = async (regattaList) => {
  const pois = await db.kwindooPOI.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  pois.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getRunningGroups = async (regattaList) => {
  const runningGroups = await db.kwindooRunningGroup.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  runningGroups.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getVideoStreams = async (regattaList) => {
  const videoStreams = await db.kwindooVideoStream.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  videoStreams.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};
const getWaypoints = async (regattaList) => {
  const waypoints = await db.kwindooWaypoint.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  waypoints.forEach((row) => {
    let currentList = result.get(row.regatta);
    result.set(row.regatta, [...(currentList || []), row]);
  });
  return result;
};

const processKwindooData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('kwindoo')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('kwindoo_pos')).path;

  const regattas = await getRegattas();
  if (regattas.length === 0) {
    return '';
  }
  const regattaList = regattas.map((row) => row.id);
  const mapOwner = await getRegattaOwners();

  const races = await getRaces(regattaList);
  const boats = await getBoats(regattaList);
  const comments = await getComments(regattaList);
  const homeportLocations = await getHomeportLocations(regattaList);
  const markers = await getMarkers(regattaList);
  const mias = await getMIAs(regattaList);
  const pois = await getPOIs(regattaList);
  const runningGroups = await getRunningGroups(regattaList);
  const videoStreams = await getVideoStreams(regattaList);
  const waypoints = await getWaypoints(regattaList);

  const writer = await parquet.ParquetWriter.openFile(
    kwindooCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < regattas.length; i++) {
    const {
      id: regatta_id,
      original_id,
      owner,
      owner_original_id,
      name,
      timezone,
      public: publicRecord,
      private: privateRecord,
      sponsor,
      display_waypoint_pass_radius,
      name_slug,
      first_start_time,
      last_end_time,
      updated_at_timestamp,
      regatta_logo_path,
      featured_background_path,
      sponsor_logo_path,
    } = regattas[i];

    await writer.appendRow({
      regatta_id,
      original_id,
      owner,
      owner_original_id,
      owner_data: mapOwner.get(owner),
      name,
      timezone,
      public: publicRecord,
      private: privateRecord,
      sponsor,
      display_waypoint_pass_radius,
      name_slug,
      first_start_time,
      last_end_time,
      updated_at_timestamp,
      regatta_logo_path,
      featured_background_path,
      sponsor_logo_path,
      races: races.get(regatta_id),
      boats: boats.get(regatta_id),
      comments: comments.get(regatta_id),
      homeportLocations: homeportLocations.get(regatta_id),
      markers: markers.get(regatta_id),
      mias: mias.get(regatta_id),
      pois: pois.get(regatta_id),
      runningGroups: runningGroups.get(regatta_id),
      videoStreams: videoStreams.get(regatta_id),
      waypoints: waypoints.get(regatta_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    kwindooPosition,
    positionPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < regattas.length; i++) {
    const { id: regatta } = regattas[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db.kwindooPosition.findAll({
        where: { regatta },
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

  const mainUrl = await uploadFileToS3(
    parquetPath,
    `kwindoo/year=${currentYear}/month=${currentMonth}/kwindoo_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadFileToS3(
    positionPath,
    `kwindoo/year=${currentYear}/month=${currentMonth}/kwindooPosition_${fullDateFormat}.parquet`,
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
  await db.kwindooWaypoint.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooVideoStream.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooRunningGroup.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooRace.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooPosition.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooPOI.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooMIA.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooMarker.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooHomeportLocation.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooComment.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  await db.kwindooBoat.destroy({
    where: { regatta: { [Op.in]: regattaList } },
  });
  const ownerIDs = [];
  mapOwner.forEach((row) => {
    ownerIDs.push(row.id);
  });
  await db.kwindooRegattaOwner.destroy({
    where: { id: { [Op.in]: ownerIDs } },
  });
  await db.kwindooRegatta.destroy({
    where: { id: { [Op.in]: regattaList } },
  });

  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRegattaOwners,
  getRegattas,
  getRaces,
  getBoats,
  getComments,
  getHomeportLocations,
  getMarkers,
  getMIAs,
  getPOIs,
  getRunningGroups,
  getVideoStreams,
  getWaypoints,
  processKwindooData,
};
