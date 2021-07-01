const fs = require('fs');
const temp = require('temp');

const db = require('../models');
const Op = db.Sequelize.Op;
const { tackTrackerCombined } = require('../schemas/parquets/tackTracker');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getRegattas = async () => {
  const regattas = await db.tackTrackerRegatta.findAll({ raw: true });
  const mapRegatta = new Map();
  regattas.forEach((row) => {
    mapRegatta.set(row.id, row);
  });
  return mapRegatta;
};
const getRaces = async () => {
  const races = await db.tackTrackerRace.findAll({ raw: true });
  return races;
};
const getBoats = async (raceList) => {
  const boats = await db.tackTrackerBoat.findAll({
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
const getDefaults = async (raceList) => {
  const defaults = await db.tackTrackerDefault.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  defaults.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getFinishes = async (raceList) => {
  const finishes = await db.tackTrackerFinish.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  finishes.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getMarks = async (raceList) => {
  const marks = await db.tackTrackerMark.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  marks.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getPositions = async (raceList) => {
  const positions = await db.tackTrackerPosition.findAll({
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
const getStarts = async (raceList) => {
  const starts = await db.tackTrackerStart.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  starts.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const processTackTrackerData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath;
  if (!optionalPath) {
    parquetPath = (await temp.open('tacktracker')).path;
  }

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapRegatta = await getRegattas();
  const boats = await getBoats(raceList);
  const defaults = await getDefaults(raceList);
  const finishes = await getFinishes(raceList);
  const marks = await getMarks(raceList);
  const positions = await getPositions(raceList);
  const starts = await getStarts(raceList);

  const data = races.map((row) => {
    const {
      id: race_id,
      original_id: race_original_id,
      url,
      regatta,
      regatta_original_id,
      user,
      user_original_id,
      start,
      state,
      name,
      type,
      finish_at_start,
      span,
      course,
      event_notes,
      course_notes,
      upload_params,
    } = row;

    const regattaData = regatta ? mapRegatta.get(regatta) : null;

    return {
      race_id,
      race_original_id,
      url,
      regatta,
      regatta_original_id,
      regatta_url: regattaData ? regattaData.url : null,
      user,
      user_original_id,
      start,
      state,
      name,
      type,
      finish_at_start,
      span,
      course,
      event_notes,
      course_notes,
      upload_params,
      boats: boats.get(race_id),
      defaults: defaults.get(race_id),
      finishes: finishes.get(race_id),
      marks: marks.get(race_id),
      positions: positions.get(race_id),
      starts: starts.get(race_id),
    };
  });
  await writeToParquet(data, tackTrackerCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `tackTracker/year=${currentYear}/month=${currentMonth}/tackTracker_${fullDateFormat}.parquet`,
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
  getRegattas,
  getBoats,
  getDefaults,
  getFinishes,
  getMarks,
  getPositions,
  getStarts,
  processTackTrackerData,
};
