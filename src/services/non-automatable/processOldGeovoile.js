const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../../models');
const Op = db.Sequelize.Op;
const {
  oldGeovoileCombined,
  oldGeovoileBoatPosition,
} = require('../../schemas/parquets/oldGeovoile');
const yyyymmddFormat = require('../../utils/yyyymmddFormat');
const uploadUtil = require('../../utils/uploadUtil');

const getRaces = async () => {
  const races = await db.oldGeovoileRace.findAll({ raw: true });
  return races;
};
const getObjectToRaceMapping = async (tableName, raceList) => {
  const result = await db[tableName].findAll({
    where: { race_id: { [Op.in]: raceList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.race_id);
    mapping.set(row.race_id, [...(currentList || []), row]);
  });
  return mapping;
};

const processOldGeovoile = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('oldGeovoile')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('oldGeovoile_pos')).path;
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }

  const raceList = races.map((row) => row.id);

  const boatMap = await getObjectToRaceMapping('oldGeovoileBoat', raceList);

  const writer = await parquet.ParquetWriter.openFile(
    oldGeovoileCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const { id: race_id, url, name, start_time } = races[i];
    await writer.appendRow({
      id: race_id,
      name,
      url,
      start_time,
      boats: boatMap.get(race_id),
    });
  }
  await writer.close();

  await createWriter(
    oldGeovoileBoatPosition,
    positionPath,
    'race_id',
    raceList,
    'oldGeovoileBoatPosition',
  );

  const mainUrl = await uploadUtil.uploadFileToS3(
    parquetPath,
    `oldgeovoile/year=${currentYear}/month=${currentMonth}/oldgeovoile_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `oldgeovoile/year=${currentYear}/month=${currentMonth}/oldgeovoilePosition_${fullDateFormat}.parquet`,
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
  const where = { id: { [Op.in]: raceList } };
  const whereRace = { race_id: { [Op.in]: raceList } };
  await db.oldGeovoileRace.destroy({
    where,
  });
  await db.oldGeovoileBoat.destroy({
    where: whereRace,
  });
  await db.oldGeovoileBoatPosition.destroy({
    where: whereRace,
  });

  return {
    mainUrl,
    positionUrl,
  };
};

const createWriter = async (
  parquetSchema,
  parquetPath,
  baseId,
  collection,
  dbName,
) => {
  const writer = await parquet.ParquetWriter.openFile(
    parquetSchema,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < collection.length; i++) {
    const id = collection[i]?.id ? collection[i].id : collection[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db[dbName].findAll({
        where: { [baseId]: id },
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
  }
  await writer.close();
};
module.exports = {
  getRaces,
  getObjectToRaceMapping,
  processOldGeovoile,
};
