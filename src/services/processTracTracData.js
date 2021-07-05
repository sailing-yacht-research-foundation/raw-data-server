const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  tractracCombined,
  tractracCompetitorPosition,
} = require('../schemas/parquets/tractrac');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');

const getEvents = async () => {
  const events = await db.tractracEvent.findAll({ raw: true });
  const mapEvent = new Map();
  events.forEach((row) => {
    mapEvent.set(row.id, row);
  });
  return mapEvent;
};
const getRaces = async () => {
  const races = await db.tractracRace.findAll({ raw: true });
  return races;
};
const getClasses = async () => {
  const classes = await db.tractracClass.findAll({ raw: true });
  const mapClass = new Map();
  classes.forEach((row) => {
    mapClass.set(row.id, row);
  });
  return mapClass;
};
const getRaceClasses = async (raceList) => {
  const classes = await db.tractracRaceClass.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  classes.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getRoutes = async (raceList) => {
  const routes = await db.tractracRoute.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  routes.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getControls = async (raceList) => {
  const controls = await db.tractracControl.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  controls.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getControlPoints = async (raceList) => {
  const controlPoints = await db.tractracControlPoint.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  controlPoints.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getControlPointPositions = async (raceList) => {
  const cpp = await db.tractracControlPointPosition.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  cpp.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCompetitors = async (raceList) => {
  const competitors = await db.tractracCompetitor.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  competitors.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCompetitorPassings = async (raceList) => {
  const passings = await db.tractracCompetitorPassing.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  passings.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCompetitorResults = async (raceList) => {
  const results = await db.tractracCompetitorResult.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const mapResult = new Map();
  results.forEach((row) => {
    let currentList = mapResult.get(row.race);
    mapResult.set(row.race, [...(currentList || []), row]);
  });
  return mapResult;
};

const processTracTracData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('tractrac')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('tractrac_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const mapEvent = await getEvents();
  const mapClass = await getClasses();
  const routes = await getRoutes(raceList);
  const classes = await getRaceClasses(raceList);

  const controls = await getControls(raceList);
  const controlPoints = await getControlPoints(raceList);
  const controlPointPositions = await getControlPointPositions(raceList);

  const competitors = await getCompetitors(raceList);
  const competitorPassings = await getCompetitorPassings(raceList);
  const competitorResults = await getCompetitorResults(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    tractracCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: original_race_id,
      event,
      event_original_id,
      name,
      url,
      tracking_start,
      tracking_stop,
      race_start,
      race_end,
      status,
      lon,
      lat,
      calculated_start_time,
      race_handicap,
    } = races[i];

    const raceClasses = classes.get(race_id);

    await writer.appendRow({
      race_id,
      original_race_id,
      event,
      event_original_id,
      event_data: event ? mapEvent.get(event) : null,
      name,
      url,
      tracking_start,
      tracking_stop,
      race_start,
      race_end,
      status,
      lon,
      lat,
      calculated_start_time,
      race_handicap,
      routes: routes.get(race_id),
      classes: raceClasses
        ? raceClasses.map((row) => {
            const { id, boat_class } = row;
            const classData = mapClass.get(boat_class);
            return {
              id,
              boat_class,
              original_boat_class_id: classData.original_id,
              name: classData.name,
            };
          })
        : [],
      controls: controls.get(race_id),
      controlPoints: controlPoints.get(race_id),
      controlPointPositions: controlPointPositions.get(race_id),
      competitors: competitors.get(race_id),
      competitorPassings: competitorPassings.get(race_id),
      competitorResults: competitorResults.get(race_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    tractracCompetitorPosition,
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
      const data = await db.tractracCompetitorPosition.findAll({
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
    `tractrac/year=${currentYear}/month=${currentMonth}/tractrac_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadFileToS3(
    positionPath,
    `tractrac/year=${currentYear}/month=${currentMonth}/tractracPosition_${fullDateFormat}.parquet`,
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
  getEvents,
  getRaces,
  getClasses,
  getRaceClasses,
  getRoutes,
  getControls,
  getControlPoints,
  getControlPointPositions,
  getCompetitors,
  getCompetitorPassings,
  getCompetitorResults,
  processTracTracData,
};
