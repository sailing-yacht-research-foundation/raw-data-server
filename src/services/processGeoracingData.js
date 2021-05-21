const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { georacingCombined } = require('../schemas/parquets/georacing');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

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
const getPositions = async (eventList) => {
  const positions = await db.georacingPosition.findAll({
    where: { event: { [Op.in]: eventList } },
    raw: true,
  });
  const result = new Map();
  positions.forEach((row) => {
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
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};

const processGeoracingData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-georacing');

  const parquetPath = `${dirPath}/georacing.parquet`;
  const events = await getEvents();
  if (events.length === 0) {
    return '';
  }
  const eventList = events.map((row) => row.id);

  const actors = await getActors(eventList);
  const positions = await getPositions(eventList);

  const { splittimeIDs, splittimeMap } = await getSplittime(eventList);
  const splittimeObjects = await getSplittimeObjects(splittimeIDs);

  const { raceIDs, raceMap } = await getRaces(eventList);
  const weathers = await getWeathers(raceIDs);
  const courses = await getCourses(raceIDs);
  const courseObjects = await getCourseObjects(raceIDs);
  const courseElements = await getCourseElements(raceIDs);
  const groundPlaces = await getGroundPlace(raceIDs);
  const lines = await getLines(raceIDs);

  const data = events.map((row) => {
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
    } = row;

    const eventRaces = raceMap.get(event_id);
    const finalRaces = eventRaces
      ? eventRaces.map((row) => {
          return Object.assign({}, row, {
            weathers: JSON.stringify(weathers.get(row.id)),
            courses: JSON.stringify(courses.get(row.id)),
            course_objects: JSON.stringify(courseObjects.get(row.id)),
            course_elements: JSON.stringify(courseElements.get(row.id)),
            ground_places: JSON.stringify(groundPlaces.get(row.id)),
            lines: JSON.stringify(lines.get(row.id)),
          });
        })
      : [];
    const eventSplittimes = splittimeMap.get(event_id);
    const finalSplittimes = eventSplittimes
      ? eventSplittimes.map((row) => {
          return Object.assign({}, row, {
            objects: JSON.stringify(splittimeObjects.get(row.id)),
          });
        })
      : [];

    return {
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
      splittimes: finalSplittimes,
      actors: actors.get(event_id),
      positions: positions.get(event_id),
    };
  });
  await writeToParquet(data, georacingCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `georacing/year=${currentYear}/month=${currentMonth}/georacing_${fullDateFormat}.parquet`,
  );
  // temp.cleanup();
  return fileUrl;
};

module.exports = processGeoracingData;
