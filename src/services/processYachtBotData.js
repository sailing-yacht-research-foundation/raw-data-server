const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  yachtbotCombined,
  yachtbotPosition,
} = require('../schemas/parquets/yachtBot');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');

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
const processYachtBotData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('yachtbot')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('yachtbot_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const buoys = await getBuoys(raceList);
  const yachts = await getYachts(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    yachtbotCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: race_original_id,
      name,
      start_time,
      end_time,
      manual_wind,
      course_direction,
      url,
    } = races[i];

    await writer.appendRow({
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
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    yachtbotPosition,
    positionPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const { id: race } = races[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db.yachtBotPosition.findAll({
        where: { race },
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
    `yachtbot/year=${currentYear}/month=${currentMonth}/yachtbot_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadFileToS3(
    positionPath,
    `yachtbot/year=${currentYear}/month=${currentMonth}/yachtbotPosition_${fullDateFormat}.parquet`,
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
  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRaces,
  getBuoys,
  getYachts,
  processYachtBotData,
};
