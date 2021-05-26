const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { metasailCombined } = require('../schemas/parquets/metasail');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getEvents = async () => {
  const events = await db.metasailEvent.findAll({ raw: true });
  const mapEvent = new Map();
  events.forEach((row) => {
    mapEvent.set(row.id, row);
  });
  return mapEvent;
};
const getRaces = async () => {
  const races = await db.metasailRace.findAll({ raw: true });
  return races;
};
const getBoats = async (raceList) => {
  const boats = await db.metasailBoat.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  boats.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getBuoys = async (raceList) => {
  const buoys = await db.metasailBuoy.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  buoys.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getGates = async (raceList) => {
  const gates = await db.metasailGate.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  gates.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getPositions = async (raceList) => {
  const positions = await db.metasailPosition.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  positions.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const processMetasailData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-metasail');

  const parquetPath = `${dirPath}/metasail.parquet`;
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapEvent = await getEvents();
  const boats = await getBoats(raceList);
  const buoys = await getBuoys(raceList);
  const gates = await getGates(raceList);
  const positions = await getPositions(raceList);

  const data = races.map((row) => {
    const {
      id: race_id,
      original_id: race_original_id,
      event,
      event_original_id,
      name,
      start,
      stop,
      url,
      stats,
      passings,
    } = row;

    return {
      race_id,
      race_original_id,
      event,
      event_original_id,
      event_data: event ? mapEvent.get(event) : null,
      name,
      start,
      stop,
      url,
      stats,
      passings,
      boats: boats.get(race_id),
      buoys: buoys.get(race_id),
      gates: gates.get(race_id),
      positions: positions.get(race_id),
    };
  });
  await writeToParquet(data, metasailCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `metasail/year=${currentYear}/month=${currentMonth}/metasail_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = {
  getRaces,
  getEvents,
  getBoats,
  getBuoys,
  getPositions,
  getGates,
  processMetasailData,
};
