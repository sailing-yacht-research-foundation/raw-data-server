const fs = require('fs');
const temp = require('temp');

const db = require('../models');
const Op = db.Sequelize.Op;
const { estelaCombined } = require('../schemas/parquets/estela');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

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
const getDorsals = async (raceList) => {
  const dorsals = await db.estelaDorsal.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  dorsals.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
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
const getPositions = async (raceList) => {
  const positions = await db.estelaPosition.findAll({
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
  let parquetPath = optionalPath;
  if (!optionalPath) {
    parquetPath = (await temp.open('estela')).path;
  }

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapClub = await getClubs(raceList);
  const buoys = await getBuoys(raceList);
  const dorsals = await getDorsals(raceList);
  const players = await getPlayers(raceList);
  const positions = await getPositions(raceList);
  const results = await getResults(raceList);

  const data = races.map((row) => {
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
    } = row;

    return {
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
      positions: positions.get(race_id),
      dorsals: dorsals.get(race_id),
      players: players.get(race_id),
      results: results.get(race_id),
    };
  });
  await writeToParquet(data, estelaCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `estela/year=${currentYear}/month=${currentMonth}/estela_${fullDateFormat}.parquet`,
  );
  if (!optionalPath) {
    fs.unlink(parquetPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  return fileUrl;
};

module.exports = {
  getRaces,
  getClubs,
  getBuoys,
  getDorsals,
  getPlayers,
  getPositions,
  getResults,
  processEstelaData,
};
