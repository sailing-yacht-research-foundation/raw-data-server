const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { yachtbotCombined } = require('../schemas/parquets/yachtBot');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getRaces = async () => {
  const races = await db.yachtBotRace.findAll({ raw: true });
  return races;
};
const getBuoys = async (raceList) => {
  const buoys = await db.yachtBotBuoy.findAll({
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
const getYachts = async (raceList) => {
  const yachts = await db.yachtBotYacht.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  yachts.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getPositions = async (raceList) => {
  const positions = await db.yachtBotPosition.findAll({
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
const processYachtBotData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath;
  if (!optionalPath) {
    const dirPath = await temp.mkdir('rds-yachtbot');
    parquetPath = `${dirPath}/yachtbot.parquet`;
  }

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const buoys = await getBuoys(raceList);
  const yachts = await getYachts(raceList);
  const positions = await getPositions(raceList);

  const data = races.map((row) => {
    const {
      id: race_id,
      original_id: race_original_id,
      name,
      start_time,
      end_time,
      manual_wind,
      course_direction,
      url,
    } = row;

    return {
      race_id,
      race_original_id,
      name,
      start_time,
      end_time,
      manual_wind,
      course_direction,
      url,
      yachts: yachts.get(race_id),
      buoys: buoys.get(race_id),
      positions: positions.get(race_id),
    };
  });
  await writeToParquet(data, yachtbotCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `yachtbot/year=${currentYear}/month=${currentMonth}/yachtbot_${fullDateFormat}.parquet`,
  );
  if (!optionalPath) {
    temp.cleanup();
  }
  return fileUrl;
};

module.exports = {
  getRaces,
  getBuoys,
  getYachts,
  getPositions,
  processYachtBotData,
};
