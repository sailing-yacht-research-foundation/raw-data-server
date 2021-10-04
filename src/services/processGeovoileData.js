const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  modernGeovoileCombined,
  modernGeovoileBoatPosition,
} = require('../schemas/parquets/modernGeovoile');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadUtil = require('./uploadUtil');

const getRaces = async () => {
  const races = await db.geovoileRace.findAll({ raw: true });
  return races;
};

const getBoats = async (raceList) => {
  const boats = await db.geovoileBoat.findAll({
    where: { race_id: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  boats.forEach((row) => {
    const currentList = result.get(row.race_id) || [];
    result.set(row.race_id, [...currentList, row]);
  });
  return result;
};

const getSailors = async (raceList) => {
  const sailors = await db.geovoileBoatSailor.findAll({
    where: { race_id: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  sailors.forEach((row) => {
    let currentList = result.get(row.boat_id) || [];
    result.set(row.boat_id, [...currentList, row]);
  });
  return result;
};

const processGeovoileData = async (optionalPath) => {
  console.log('----- START processGeovoileData -----');
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('geovoile')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('geovoile_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapBoats = await getBoats(raceList);
  const mapSailors = await getSailors(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    modernGeovoileCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );

  for (const race of races) {
    const {
      id,
      original_id,
      legNum,
      numLegs,
      name,
      url,
      scrapedUrl,
      raceState,
      eventState,
      prerace,
      startTime,
      endTime,
      isGame,
    } = race;

    const raceBoats = mapBoats.get(id);

    const boats = (raceBoats || []).map((boat) => {
      return { ...boat, sailors: mapSailors.get(boat.id) };
    });
    await writer.appendRow({
      id,
      original_id,
      legNum,
      numLegs,
      name,
      url,
      scrapedUrl,
      raceState,
      eventState,
      prerace,
      startTime,
      endTime,
      isGame,
      boats,
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    modernGeovoileBoatPosition,
    positionPath,
    {
      useDataPageV2: false,
    },
  );
  for (const race of races) {
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db.geovoileBoatPosition.findAll({
        where: {
          race_id: {
            [Op.eq]: race.id,
          },
        },
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
    `geovoile/year=${currentYear}/month=${currentMonth}/geovoile_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `geovoile/year=${currentYear}/month=${currentMonth}/geovoilePosition_${fullDateFormat}.parquet`,
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
  await db.geovoileRace.destroy({
    where: { id: { [Op.in]: raceList } },
  });
  await db.geovoileBoat.destroy({
    where: { race_id: { [Op.in]: raceList } },
  });
  await db.geovoileBoatSailor.destroy({
    where: { race_id: { [Op.in]: raceList } },
  });
  await db.geovoileBoatPosition.destroy({
    where: { race_id: { [Op.in]: raceList } },
  });

  console.log('----- FINISH processGeovoileData -----');
  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRaces,
  getBoats,
  getSailors,
  processGeovoileData,
};
