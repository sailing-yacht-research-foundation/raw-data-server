const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { yellowbrickCombined } = require('../schemas/parquets/yellowbrick');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

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
const getPositions = async (regattaList) => {
  const positions = await db.kwindooPosition.findAll({
    where: { regatta: { [Op.in]: regattaList } },
    raw: true,
  });
  const result = new Map();
  positions.forEach((row) => {
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

const processKwindooData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-kwindoo');

  const parquetPath = `${dirPath}/kwindoo.parquet`;
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
  const positions = await getPositions(regattaList);
  const runningGroups = await getRunningGroups(regattaList);
  const videoStreams = await getVideoStreams(regattaList);
  const waypoints = await getWaypoints(regattaList);

  const data = regattas.map((row) => {
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
    } = row;

    return {
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
      positions: positions.get(regatta_id),
      runningGroups: runningGroups.get(regatta_id),
      videoStreams: videoStreams.get(regatta_id),
      waypoints: waypoints.get(regatta_id),
    };
  });
  await writeToParquet(data, yellowbrickCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `kwindoo/year=${currentYear}/month=${currentMonth}/kwindoo_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
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
  getPositions,
  getRunningGroups,
  getVideoStreams,
  getWaypoints,
  processKwindooData,
};
