const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  estelaCombined,
  estelaPosition,
} = require('../schemas/parquets/estela');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadUtil = require('./uploadUtil');

const getRaces = async () => {
  const races = await db.estelaRace.findAll({ raw: true });
  return races;
};
const getClubs = async () => {
  const clubs = await db.estelaClub.findAll({ raw: true });
  const mapClub = new Map();
  clubs.forEach((row) => {
    mapClub.set(row.id, row);
  });
  return mapClub;
};
const getBuoys = async (raceList) => {
  const buoys = await db.estelaBuoy.findAll({
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
const getDorsals = async (race) => {
  const dorsals = await db.estelaDorsal.findAll({
    where: { race },
    raw: true,
  });
  return dorsals;
};
const getPlayers = async (raceList) => {
  const players = await db.estelaPlayer.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  players.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getResults = async (raceList) => {
  const results = await db.estelaResult.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  results.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const processEstelaData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('estela')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('estela_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapClub = await getClubs();
  const buoys = await getBuoys(raceList);
  const players = await getPlayers(raceList);
  const results = await getResults(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    estelaCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: race_original_id,
      initLon,
      initLat,
      end,
      end_timestamp,
      ended_at,
      has_ended,
      has_started,
      length,
      name,
      offset,
      onset,
      onset_timestamp,
      scheduled_timestamp,
      start,
      start_timestamp,
      url,
      gpx,
      winds_csv,
      leg_winds_csv,
      results_csv,
      club,
      club_original_id,
    } = races[i];

    await writer.appendRow({
      race_id,
      race_original_id,
      initLon,
      initLat,
      end,
      end_timestamp,
      ended_at,
      has_ended,
      has_started,
      length,
      name,
      offset,
      onset,
      onset_timestamp,
      scheduled_timestamp,
      start,
      start_timestamp,
      url,
      gpx,
      winds_csv,
      leg_winds_csv,
      results_csv,
      club,
      club_original_id,
      club_data: club ? mapClub.get(club) : null,
      buoys: buoys.get(race_id),
      // Based on testing, dorsals have very large csv data. To prevent too much memory usage, query on each race instead
      dorsals: await getDorsals(race_id),
      players: players.get(race_id),
      results: results.get(race_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    estelaPosition,
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
      const data = await db.estelaPosition.findAll({
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
    `estela/year=${currentYear}/month=${currentMonth}/estela_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `estela/year=${currentYear}/month=${currentMonth}/estelaPosition_${fullDateFormat}.parquet`,
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
  await db.estelaResult.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.estelaPlayer.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.estelaBuoy.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  const mapIDs = [];
  mapClub.forEach((row) => {
    mapIDs.push(row.id);
  });
  await db.estelaClub.destroy({
    where: { id: { [Op.in]: mapIDs } },
  });
  await db.estelaDorsal.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.estelaPosition.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.estelaRace.destroy({
    where: { id: { [Op.in]: raceList } },
  });

  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRaces,
  getClubs,
  getBuoys,
  getDorsals,
  getPlayers,
  getResults,
  processEstelaData,
};
