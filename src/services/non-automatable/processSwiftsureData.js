const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../../models');
const Op = db.Sequelize.Op;
const {
  swiftsureCombined,
  swiftsurePosition,
} = require('../../schemas/parquets/swiftsure');
const yyyymmddFormat = require('../../utils/yyyymmddFormat');
const uploadUtil = require('../uploadUtil');

const getRaces = async () => {
  const races = await db.swiftsureRace.findAll({ raw: true });
  return races;
};
const getObjectToRaceMapping = async (tableName, raceList) => {
  const result = await db[tableName].findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.race);
    mapping.set(row.race, [...(currentList || []), row]);
  });
  return mapping;
};

const processSwiftsureData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('swiftsure')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('swiftsure_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }

  const raceList = races.map((row) => row.id);

  const boatsMap = await getObjectToRaceMapping('swiftsureBoat', raceList);
  const linesMap = await getObjectToRaceMapping('swiftsureLine', raceList);
  const linksMap = await getObjectToRaceMapping('swiftsureLink', raceList);
  const marksMap = await getObjectToRaceMapping('swiftsureMark', raceList);
  const pointsMap = await getObjectToRaceMapping('swiftsurePoint', raceList);
  const sponsorsMap = await getObjectToRaceMapping('swiftsureSponsor', raceList);

  const writer = await parquet.ParquetWriter.openFile(
    swiftsureCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: race_original_id,
      welcome,
      race_start,
      course_bounds_n,
      course_bounds_s,
      course_bounds_e,
      course_bounds_w,
      home_bounds_n,
      home_bounds_s,
      home_bounds_e,
      home_bounds_w,
      fin_bounds_n,
      fin_bounds_s,
      fin_bounds_e,
      fin_bounds_w,
      timezone,
      track_type,
      event_type,
      update_interval,
      tag_interval,
      url,
      default_facebook,
    } = races[i];

    await writer.appendRow({
      race_id,
      race_original_id,
      welcome,
      race_start,
      course_bounds_n,
      course_bounds_s,
      course_bounds_e,
      course_bounds_w,
      home_bounds_n,
      home_bounds_s,
      home_bounds_e,
      home_bounds_w,
      fin_bounds_n,
      fin_bounds_s,
      fin_bounds_e,
      fin_bounds_w,
      timezone,
      track_type,
      event_type,
      update_interval,
      tag_interval,
      url,
      default_facebook,
      boats: boatsMap.get(race_id),
      lines: linesMap.get(race_id),
      links: linksMap.get(race_id),
      marks: marksMap.get(race_id),
      points: pointsMap.get(race_id),
      sponsors: sponsorsMap.get(race_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    swiftsurePosition,
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
      const data = await db.swiftsurePosition.findAll({
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

  const mainUrl = await uploadUtil.uploadFileToS3(
    parquetPath,
    `swiftsure/year=${currentYear}/month=${currentMonth}/swiftsure_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `swiftsure/year=${currentYear}/month=${currentMonth}/swiftsurePosition_${fullDateFormat}.parquet`,
  );

  if (!optionalPath) {
    console.log('parquetPath', parquetPath);
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
  const where = { race: { [Op.in]: raceList } };
  await db.swiftsureBoat.destroy({
    where,
  });
  await db.swiftsureLine.destroy({
    where,
  });
  await db.swiftsureLink.destroy({
    where,
  });
  await db.swiftsureMark.destroy({
    where,
  });
  await db.swiftsurePoint.destroy({
    where,
  });
  await db.swiftsurePosition.destroy({
    where,
  });
  await db.swiftsureSponsor.destroy({
    where,
  });
  await db.swiftsureRace.destroy({
    where: { id: { [Op.in]: raceList } },
  });

  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRaces,
  getObjectToRaceMapping,
  processSwiftsureData,
};
