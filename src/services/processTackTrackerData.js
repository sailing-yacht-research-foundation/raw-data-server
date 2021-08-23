const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  tackTrackerCombined,
  tackTrackerPosition,
} = require('../schemas/parquets/tackTracker');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadUtil = require('./uploadUtil');

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

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('tacktracker')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('tacktracker_pos')).path;

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
  const starts = await getStarts(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    tackTrackerCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
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
    } = races[i];

    const regattaData = regatta ? mapRegatta.get(regatta) : null;

    await writer.appendRow({
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
      starts: starts.get(race_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    tackTrackerPosition,
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
      const data = await db.tackTrackerPosition.findAll({
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
    `tacktracker/year=${currentYear}/month=${currentMonth}/tacktracker_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `tacktracker/year=${currentYear}/month=${currentMonth}/tacktrackerPosition_${fullDateFormat}.parquet`,
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
  await db.tackTrackerBoat.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.tackTrackerDefault.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.tackTrackerFinish.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.tackTrackerMark.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.tackTrackerStart.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  await db.tackTrackerPosition.destroy({
    where: { race: { [Op.in]: raceList } },
  });
  const regattaIDs = [];
  mapRegatta.forEach((row) => {
    regattaIDs.push(row.id);
  });
  await db.tackTrackerRegatta.destroy({
    where: { id: { [Op.in]: regattaIDs } },
  });
  await db.tackTrackerRace.destroy({
    where: { id: { [Op.in]: raceList } },
  });

  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRaces,
  getRegattas,
  getBoats,
  getDefaults,
  getFinishes,
  getMarks,
  getStarts,
  processTackTrackerData,
};
