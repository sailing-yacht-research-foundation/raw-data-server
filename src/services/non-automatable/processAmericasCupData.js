const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../../models');
const Op = db.Sequelize.Op;
const {
  americasCupPosition,
  americasCupAvgWind,
  americasCupBoat,
  americasCupBoatShape,
  americasCupRegatta,
  americasCupCombined,
} = require('../../schemas/parquets/americasCup');
const yyyymmddFormat = require('../../utils/yyyymmddFormat');
const uploadUtil = require('../../utils/uploadUtil');

const getRaces = async () => {
  const races = await db.americasCupRace.findAll({ raw: true });
  return races;
};

const getObjectToRaceMapping = async (tableName, raceList) => {
  const result = await db[tableName].findAll({
    where: { race_original_id: { [Op.in]: raceList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.race);
    mapping.set(row.race, [...(currentList || []), row]);
  });
  return mapping;
};

const processAmericasCupData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let combinedPath = optionalPath
    ? optionalPath.main
    : (await temp.open('americascup')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('americascup_pos')).path;
  let avgWindPath = optionalPath
    ? optionalPath.avgWind
    : (await temp.open('americascup_avgWind')).path;
  let boatPath = optionalPath
    ? optionalPath.boat
    : (await temp.open('americascup_boat')).path;
  let boatShapePath = optionalPath
    ? optionalPath.boatShape
    : (await temp.open('americascup_boatShape')).path;
  let regattaPath = optionalPath
    ? optionalPath.regatta
    : (await temp.open('americascup_regatta')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }

  const raceList = races.map((row) => row.original_id);

  const compoundMarksMap = await getObjectToRaceMapping(
    'americasCupCompoundMark',
    raceList,
  );
  const courseLimitsMap = await getObjectToRaceMapping(
    'americasCupCourseLimit',
    raceList,
  );
  const eventsMap = await getObjectToRaceMapping('americasCupEvent', raceList);
  const marksMap = await getObjectToRaceMapping('americasCupMark', raceList);

  const writer = await parquet.ParquetWriter.openFile(
    americasCupCombined,
    combinedPath,
    {
      useDataPageV2: false,
    },
  );
  for (const race of races) {
    const {
      id: race_id,
      original_id: race_original_id,
      type,
      name,
      start_time,
      postpone,
      creation_time_date,
      regatta,
      regatta_original_id,
      participants,
    } = race;

    await writer.appendRow({
      race_id,
      race_original_id,
      type,
      name,
      start_time,
      postpone,
      creation_time_date,
      regatta,
      regatta_original_id,
      participants: participants.toString(),
      compound_marks: compoundMarksMap.get(race_id),
      course_limits: courseLimitsMap.get(race_id),
      events: eventsMap.get(race_id),
      marks: marksMap.get(race_id),
    });
  }
  await writer.close();

  await fetchAndWriteToParquet({
    parquetSchema: americasCupPosition,
    parquetPath: positionPath,
    tableName: 'americasCupPosition',
  });

  await fetchAndWriteToParquet({
    parquetSchema: americasCupAvgWind,
    parquetPath: avgWindPath,
    tableName: 'americasCupAvgWind',
  });

  await fetchAndWriteToParquet({
    parquetSchema: americasCupBoat,
    parquetPath: boatPath,
    tableName: 'americasCupBoat',
  });

  await fetchAndWriteToParquet({
    parquetSchema: americasCupBoatShape,
    parquetPath: boatShapePath,
    tableName: 'americasCupBoatShape',
  });

  await fetchAndWriteToParquet({
    parquetSchema: americasCupRegatta,
    parquetPath: regattaPath,
    tableName: 'americasCupRegatta',
  });

  const mainUrl = await uploadUtil.uploadFileToS3(
    combinedPath,
    `americasCup/year=${currentYear}/month=${currentMonth}/americasCup_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `americasCup/year=${currentYear}/month=${currentMonth}/americasCupPosition_${fullDateFormat}.parquet`,
  );
  const avgWindUrl = await uploadUtil.uploadFileToS3(
    avgWindPath,
    `americasCup/year=${currentYear}/month=${currentMonth}/americasCupAvgWind_${fullDateFormat}.parquet`,
  );
  const boatUrl = await uploadUtil.uploadFileToS3(
    boatPath,
    `americasCup/year=${currentYear}/month=${currentMonth}/americasCupBoat_${fullDateFormat}.parquet`,
  );
  const boatShapeUrl = await uploadUtil.uploadFileToS3(
    boatShapePath,
    `americasCup/year=${currentYear}/month=${currentMonth}/americasCupBoatShape_${fullDateFormat}.parquet`,
  );
  const regattaUrl = await uploadUtil.uploadFileToS3(
    regattaPath,
    `americasCup/year=${currentYear}/month=${currentMonth}/americasCupRegatta_${fullDateFormat}.parquet`,
  );

  if (!optionalPath) {
    fs.unlink(combinedPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(avgWindPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(boatPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(boatShapePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(regattaPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Delete parqueted data from DB
  const where = { race_original_id: { [Op.in]: raceList } };
  await db.americasCupCompoundMark.destroy({
    where,
  });
  await db.americasCupCourseLimit.destroy({
    where,
  });
  await db.americasCupEvent.destroy({
    where,
  });
  await db.americasCupMark.destroy({
    where,
  });
  await db.americasCupPosition.destroy({ truncate: true });
  await db.americasCupAvgWind.destroy({ truncate: true });
  await db.americasCupBoat.destroy({ truncate: true });
  await db.americasCupBoatShape.destroy({ truncate: true });
  await db.americasCupRegatta.destroy({ truncate: true });
  await db.americasCupRace.destroy({
    where: { original_id: { [Op.in]: raceList } },
  });

  return {
    mainUrl,
    positionUrl,
    avgWindUrl,
    boatUrl,
    boatShapeUrl,
    regattaUrl,
  };
};

const fetchAndWriteToParquet = async ({
  parquetSchema,
  parquetPath,
  tableName,
}) => {
  const writer = await parquet.ParquetWriter.openFile(
    parquetSchema,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  const perPage = 50000;
  let page = 1;
  let pageSize = 0;
  do {
    const data = await db[tableName].findAll({
      raw: true,
      offset: (page - 1) * perPage,
      limit: perPage,
    });
    pageSize = data.length;
    page++;
    while (data.length > 0) {
      await writer.appendRow(data.pop());
    }
  } while (pageSize === perPage);

  await writer.close();
};

module.exports = {
  getRaces,
  getObjectToRaceMapping,
  processAmericasCupData,
};
