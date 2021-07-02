const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  georacingCombined,
  georacingPosition,
} = require('../schemas/parquets/georacing');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');

const getEvents = async () => {
  const events = await db.georacingEvent.findAll({ raw: true });
  return events;
};
const getRaces = async (eventList) => {
  const races = await db.georacingRace.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const raceMap = new Map();
  const raceIDs = [];
  races.forEach((row) => {
    raceIDs.push(row.id);
    let currentList = raceMap.get(row.event);
    raceMap.set(row.event, [...(currentList || []), row]);
  });
  return { raceIDs, raceMap };
};
const getWeathers = async (raceList) => {
  const weathers = await db.georacingWeather.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  weathers.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCourses = async (raceList) => {
  const courses = await db.georacingCourse.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  courses.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCourseObjects = async (raceList) => {
  const courseObjects = await db.georacingCourseObject.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  courseObjects.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCourseElements = async (raceList) => {
  const courseElements = await db.georacingCourseElement.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  courseElements.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getGroundPlace = async (raceList) => {
  const groundPlaces = await db.georacingGroundPlace.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  groundPlaces.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getLines = async (raceList) => {
  const lines = await db.georacingLine.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  lines.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getActors = async (eventList) => {
  const actors = await db.georacingActor.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  actors.forEach((row) => {
    let currentList = result.get(row.event);
    result.set(row.event, [...(currentList || []), row]);
  });
  return result;
};
const getSplittime = async (eventList) => {
  const splittimes = await db.georacingSplittime.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const splittimeMap = new Map();
  const splittimeIDs = [];
  splittimes.forEach((row) => {
    splittimeIDs.push(row.id);
    let currentList = splittimeMap.get(row.event);
    splittimeMap.set(row.event, [...(currentList || []), row]);
  });
  return { splittimeIDs, splittimeMap };
};
const getSplittimeObjects = async (splittimeList) => {
  const objects = await db.georacingSplittimeObject.findAll({
    where: { splittime: { [Op.in]: splittimeList } },
    raw: true,
  });
  const result = new Map();
  objects.forEach((row) => {
    let currentList = result.get(row.splittime);
    result.set(row.splittime, [...(currentList || []), row]);
  });
  return result;
};

const processGeoracingData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('georacing')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('georacing_pos')).path;

  const events = await getEvents();
  if (events.length === 0) {
    return '';
  }
  const eventList = events.map((row) => row.id);

  const actors = await getActors(eventList);

  const { splittimeIDs, splittimeMap } = await getSplittime(eventList);
  const splittimeObjects = await getSplittimeObjects(splittimeIDs);

  const { raceIDs, raceMap } = await getRaces(eventList);
  const weathers = await getWeathers(raceIDs);
  const courses = await getCourses(raceIDs);
  const courseObjects = await getCourseObjects(raceIDs);
  const courseElements = await getCourseElements(raceIDs);
  const groundPlaces = await getGroundPlace(raceIDs);
  const lines = await getLines(raceIDs);

  const writer = await parquet.ParquetWriter.openFile(
    georacingCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < events.length; i++) {
    const {
      id: event_id,
      original_id: original_event_id,
      name,
      short_name,
      time_zone,
      description_en,
      description_fr,
      short_description,
      start_time,
      end_time,
    } = events[i];
    const eventRaces = raceMap.get(event_id);

    const finalRaces = eventRaces
      ? await Promise.all(
          eventRaces.map(async (row) => {
            return Object.assign({}, row, {
              weathers: weathers.get(row.id),
              courses: courses.get(row.id),
              course_objects: courseObjects.get(row.id),
              course_elements: courseElements.get(row.id),
              ground_places: groundPlaces.get(row.id),
              lines: lines.get(row.id),
            });
          }),
        )
      : [];

    await writer.appendRow({
      event_id,
      original_event_id,
      name,
      short_name,
      time_zone,
      description_en,
      description_fr,
      short_description,
      start_time,
      end_time,
      races: finalRaces,
      splittimes: splittimeMap.get(event_id),
      splittime_objects: splittimeObjects.get(event_id),
      actors: actors.get(event_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    georacingPosition,
    positionPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < events.length; i++) {
    const { id: event } = events[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db.georacingPosition.findAll({
        where: { event },
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
    `georacing/year=${currentYear}/month=${currentMonth}/georacing_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadFileToS3(
    positionPath,
    `georacing/year=${currentYear}/month=${currentMonth}/georacing_${fullDateFormat}.parquet`,
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
  getActors,
  getWeathers,
  getCourses,
  getCourseObjects,
  getCourseElements,
  getGroundPlace,
  getLines,
  getSplittime,
  getSplittimeObjects,
  processGeoracingData,
};
