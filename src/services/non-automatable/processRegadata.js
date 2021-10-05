const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../../models');
const Op = db.Sequelize.Op;
const {
  regadataRaceCombined,
  regadataReport,
} = require('../../schemas/parquets/regadata');
const yyyymmddFormat = require('../../utils/yyyymmddFormat');
const uploadUtil = require('../uploadUtil');

const getRaces = async () => {
  const races = await db.regadataRace.findAll({ raw: true });
  return races;
};

const getObjectToRaceMapping = async (tableName, raceList) => {
  const result = await db[tableName].findAll({
    where: { race_original_id: { [Op.in]: raceList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.race_id);
    mapping.set(row.race_id, [...(currentList || []), row]);
  });
  return mapping;
};

const processRegadata = async (optionalPath) => {
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  console.log(`Start Saving Regadata Parquet file`);
  const raceList = races.map((row) => row.original_id);

  const regadataSailMap = await getObjectToRaceMapping(
    'regadataSail',
    raceList,
  );

  let combinedPath = optionalPath
    ? optionalPath.main
    : (await temp.open('regadata_race')).path;

  const writer = await parquet.ParquetWriter.openFile(
    regadataRaceCombined,
    combinedPath,
    {
      useDataPageV2: false,
    },
  );
  for (const race of races) {
    const { id, original_id } = race;
    await writer.appendRow({
      id,
      original_id,
      sails: regadataSailMap.get(id),
    });
  }
  await writer.close();

  let regadataReportPath = optionalPath
    ? optionalPath.regatta
    : (await temp.open('regadata_report')).path;
  await fetchAndWriteReportData({
    parquetSchema: regadataReport,
    parquetPath: regadataReportPath,
  });

  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const mainUrl = await uploadUtil.uploadFileToS3(
    combinedPath,
    `regadata/year=${currentYear}/month=${currentMonth}/regadataRace_${fullDateFormat}.parquet`,
  );
  const regadataReportUrl = await uploadUtil.uploadFileToS3(
    regadataReportPath,
    `regadata/year=${currentYear}/month=${currentMonth}/regadataReport_${fullDateFormat}.parquet`,
  );

  if (!optionalPath) {
    fs.unlink(combinedPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(regadataReportPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Delete parqueted data from DB
  await db.regadataReport.destroy({ truncate: true });
  await db.regadataSail.destroy({ truncate: true });
  await db.regadataRace.destroy({
    where: { original_id: { [Op.in]: raceList } },
  });

  console.log(`Finished Saving Regadata Parquet file`);

  return {
    mainUrl,
    regadataReportUrl,
  };
};

const fetchAndWriteReportData = async ({ parquetSchema, parquetPath }) => {
  let currentData;
  const numberKey = new Set([
    'timestamp',
    'rank',
    'lat_dec',
    'lon_dec',
    '1hour_heading',
    '1hour_speed',
    '1hour_vmg',
    '1hour_distance',
    'lastreport_heading',
    'lastreport_vmg',
    'lastreport_distance',
    '24hour_heading',
    '24hour_speed',
    '24hour_vmg',
    '24hour_distance',
    'dtf',
    'dtl',
    'total_distance',
    'dtl_diff',
  ]);
  try {
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
      const data = await db.regadataReport.findAll({
        raw: true,
        offset: (page - 1) * perPage,
        limit: perPage,
      });
      pageSize = data.length;
      page++;
      if (page === 5) {
        break;
      }
      while (data.length > 0) {
        currentData = data.pop();
        for (const key of Object.keys(currentData)) {
          // change the wrong data to null
          if (isNaN(currentData[key]) && numberKey.has(key)) {
            currentData[key] = null;
          }
        }
        await writer.appendRow(currentData);
      }
    } while (pageSize === perPage);

    await writer.close();
  } catch (e) {
    console.log(`Exception during process regadata, with the data below`);
    console.log(currentData);
    throw e;
  }
};
module.exports = {
  getRaces,
  getObjectToRaceMapping,
  processRegadata,
};
