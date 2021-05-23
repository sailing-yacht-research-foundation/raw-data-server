const db = require('../../models');
const saveGeoracingData = require('../saveGeoracingData');

const jsonData = require('../../test-files/georacing.json');

describe('Storing georacing data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.georacingEvent.destroy({
      truncate: true,
    });
    await db.georacingRace.destroy({
      truncate: true,
    });
    await db.georacingActor.destroy({
      truncate: true,
    });
    await db.georacingWeather.destroy({
      truncate: true,
    });
    await db.georacingCourse.destroy({
      truncate: true,
    });
    await db.georacingCourseElement.destroy({
      truncate: true,
    });
    await db.georacingCourseObject.destroy({
      truncate: true,
    });
    await db.georacingGroundPlace.destroy({
      truncate: true,
    });
    await db.georacingLine.destroy({
      truncate: true,
    });
    await db.georacingPosition.destroy({
      truncate: true,
    });
    await db.georacingSplittime.destroy({
      truncate: true,
    });
    await db.georacingSplittimeObject.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should save georacing events correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingEvent, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingEvent, 'findAll');
    await saveGeoracingData({ GeoracingEvent: jsonData.GeoracingEvent });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing races correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingRace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingRace, 'findAll');
    await saveGeoracingData({ GeoracingRace: jsonData.GeoracingRace });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing actors correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingActor, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingActor, 'findAll');
    await saveGeoracingData({ GeoracingActor: jsonData.GeoracingActor });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing weather correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingWeather, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingWeather, 'findAll');
    await saveGeoracingData({ GeoracingWeather: jsonData.GeoracingWeather });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing course correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingCourse, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingCourse, 'findAll');
    await saveGeoracingData({ GeoracingCourse: jsonData.GeoracingCourse });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing course object correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingCourseObject, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingCourseObject, 'findAll');
    await saveGeoracingData({
      GeoracingCourseObject: jsonData.GeoracingCourseObject,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing course element correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingCourseElement, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingCourseElement, 'findAll');
    await saveGeoracingData({
      GeoracingCourseElement: jsonData.GeoracingCourseElement,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing ground place correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingGroundPlace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingGroundPlace, 'findAll');
    await saveGeoracingData({
      GeoracingGroundPlace: jsonData.GeoracingGroundPlace,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing line correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingLine, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingLine, 'findAll');
    await saveGeoracingData({
      GeoracingLine: jsonData.GeoracingLine,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing position correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingPosition, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingPosition, 'findAll');
    await saveGeoracingData({
      GeoracingPosition: jsonData.GeoracingPosition,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing splittime correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingSplittime, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingSplittime, 'findAll');
    await saveGeoracingData({
      GeoracingSplittime: jsonData.GeoracingSplittime,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing splittime object correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingSplittimeObject, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingSplittimeObject, 'findAll');
    await saveGeoracingData({
      GeoracingSplittimeObject: jsonData.GeoracingSplittimeObject,
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
});
