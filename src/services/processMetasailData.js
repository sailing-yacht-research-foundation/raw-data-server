const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  metasailPosition,
  metasailCombined,
} = require('../schemas/parquets/metasail');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');

const getEvents = async () => {
  const events = await db.metasailEvent.findAll({ raw: true });
  const mapEvent = new Map();
  events.forEach((row) => {
    mapEvent.set(row.id, row);
  });
  return mapEvent;
};
const getRaces = async () => {
  const races = await db.metasailRace.findAll({ raw: true });
  return races;
};
const getBoats = async (raceList) => {
  const boats = await db.metasailBoat.findAll({
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
const getBuoys = async (raceList) => {
  const buoys = await db.metasailBuoy.findAll({
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
const getGates = async (raceList) => {
  const gates = await db.metasailGate.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  gates.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const processMetasailData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('metasail')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('metasail_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapEvent = await getEvents();
  const boats = await getBoats(raceList);
  const buoys = await getBuoys(raceList);
  const gates = await getGates(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    metasailCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: race_original_id,
      event,
      event_original_id,
      name,
      start,
      stop,
      url,
      stats,
      passings,
    } = races[i];

    await writer.appendRow({
      race_id,
      race_original_id,
      event,
      event_original_id,
      event_data: event ? mapEvent.get(event) : null,
      name,
      start,
      stop,
      url,
      stats,
      passings,
      boats: boats.get(race_id),
      buoys: buoys.get(race_id),
      gates: gates.get(race_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    metasailPosition,
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
      const data = await db.metasailPosition.findAll({
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
    `metasail/year=${currentYear}/month=${currentMonth}/metasail_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadFileToS3(
    positionPath,
    `metasail/year=${currentYear}/month=${currentMonth}/metasailPosition_${fullDateFormat}.parquet`,
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
  getEvents,
  getBoats,
  getBuoys,
  getGates,
  processMetasailData,
};
