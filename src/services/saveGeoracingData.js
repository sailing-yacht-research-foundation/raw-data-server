const db = require('../models');

const Op = db.Sequelize.Op;

const saveGeoracingData = async (data) => {
  if (data.GeoracingEvent) {
    const existEvents = await db.georacingEvent.findAll({
      where: { id: { [Op.in]: data.GeoracingEvent.map((row) => row.id) } },
    });
    const toRemove = existEvents.map((row) => row.id);

    const eventData = data.GeoracingEvent.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingEvent.bulkCreate(eventData);
  }
  if (data.GeoracingRace) {
    const existRaces = await db.georacingRace.findAll({
      where: { id: { [Op.in]: data.GeoracingRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.GeoracingRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingRace.bulkCreate(raceData);
  }
  if (data.GeoracingActor) {
    const existActors = await db.georacingActor.findAll({
      where: { id: { [Op.in]: data.GeoracingActor.map((row) => row.id) } },
    });
    const toRemove = existActors.map((row) => row.id);

    const actorData = data.GeoracingActor.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingActor.bulkCreate(actorData);
  }
  if (data.GeoracingWeather) {
    const existWeathers = await db.georacingWeather.findAll({
      where: { id: { [Op.in]: data.GeoracingWeather.map((row) => row.id) } },
    });
    const toRemove = existWeathers.map((row) => row.id);

    const weatherData = data.GeoracingWeather.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingWeather.bulkCreate(weatherData);
  }
  if (data.GeoracingCourse) {
    const existCourses = await db.georacingCourse.findAll({
      where: { id: { [Op.in]: data.GeoracingCourse.map((row) => row.id) } },
    });
    const toRemove = existCourses.map((row) => row.id);

    const courseData = data.GeoracingCourse.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingCourse.bulkCreate(courseData);
  }
  if (data.GeoracingCourseObject) {
    const existCO = await db.georacingCourseObject.findAll({
      where: {
        id: { [Op.in]: data.GeoracingCourseObject.map((row) => row.id) },
      },
    });
    const toRemove = existCO.map((row) => row.id);

    const coData = data.GeoracingCourseObject.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingCourseObject.bulkCreate(coData);
  }
  if (data.GeoracingCourseElement) {
    const existCE = await db.georacingCourseElement.findAll({
      where: {
        id: { [Op.in]: data.GeoracingCourseElement.map((row) => row.id) },
      },
    });
    const toRemove = existCE.map((row) => row.id);

    const ceData = data.GeoracingCourseElement.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingCourseElement.bulkCreate(ceData);
  }
  if (data.GeoracingGroundPlace) {
    const existGroundPlace = await db.georacingGroundPlace.findAll({
      where: {
        id: { [Op.in]: data.GeoracingGroundPlace.map((row) => row.id) },
      },
    });
    const toRemove = existGroundPlace.map((row) => row.id);

    const groundPlaceData = data.GeoracingGroundPlace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingGroundPlace.bulkCreate(groundPlaceData);
  }
  if (data.GeoracingPosition) {
    const existPositions = await db.georacingPosition.findAll({
      where: {
        id: { [Op.in]: data.GeoracingPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.GeoracingPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingPosition.bulkCreate(positionData);
  }
  if (data.GeoracingLine) {
    const existLines = await db.georacingLine.findAll({
      where: {
        id: { [Op.in]: data.GeoracingLine.map((row) => row.id) },
      },
    });
    const toRemove = existLines.map((row) => row.id);

    const lineData = data.GeoracingLine.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingLine.bulkCreate(lineData);
  }
  if (data.GeoracingSplittime) {
    const existSplittimes = await db.georacingSplittime.findAll({
      where: {
        id: { [Op.in]: data.GeoracingSplittime.map((row) => row.id) },
      },
    });
    const toRemove = existSplittimes.map((row) => row.id);

    const splittimeData = data.GeoracingSplittime.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingSplittime.bulkCreate(splittimeData);
  }
  if (data.GeoracingSplittimeObject) {
    const existSplittimeObject = await db.georacingSplittimeObject.findAll({
      where: {
        id: { [Op.in]: data.GeoracingSplittimeObject.map((row) => row.id) },
      },
    });
    const toRemove = existSplittimeObject.map((row) => row.id);

    const splittimeObjectData = data.GeoracingSplittimeObject.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.georacingSplittimeObject.bulkCreate(splittimeObjectData);
  }
  return true;
};

module.exports = saveGeoracingData;
