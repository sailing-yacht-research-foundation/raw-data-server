const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeGeoracing');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve([{ id: '123' }]));
const saveGeoracingData = require('../saveGeoracingData');
const jsonData = require('../../test-files/georacing.json');

describe('Storing georacing data to DB', () => {
  let createActor,
    createCourse,
    createCE,
    createCO,
    createEvent,
    createGroundPlace,
    createLine,
    createPosition,
    createRace,
    createSplittime,
    createSO,
    createWeather,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createActor = jest.spyOn(db.georacingActor, 'bulkCreate');
    createCourse = jest.spyOn(db.georacingCourse, 'bulkCreate');
    createCE = jest.spyOn(db.georacingCourseElement, 'bulkCreate');
    createCO = jest.spyOn(db.georacingCourseObject, 'bulkCreate');
    createEvent = jest.spyOn(db.georacingEvent, 'bulkCreate');
    createGroundPlace = jest.spyOn(db.georacingGroundPlace, 'bulkCreate');
    createLine = jest.spyOn(db.georacingLine, 'bulkCreate');
    createPosition = jest.spyOn(db.georacingPosition, 'bulkCreate');
    createRace = jest.spyOn(db.georacingRace, 'bulkCreate');
    createSplittime = jest.spyOn(db.georacingSplittime, 'bulkCreate');
    createSO = jest.spyOn(db.georacingSplittimeObject, 'bulkCreate');
    createWeather = jest.spyOn(db.georacingWeather, 'bulkCreate');
    axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.georacingEvent.destroy({ truncate: true });
    await db.georacingRace.destroy({ truncate: true });
    await db.georacingActor.destroy({ truncate: true });
    await db.georacingWeather.destroy({ truncate: true });
    await db.georacingCourse.destroy({ truncate: true });
    await db.georacingCourseElement.destroy({ truncate: true });
    await db.georacingCourseObject.destroy({ truncate: true });
    await db.georacingGroundPlace.destroy({ truncate: true });
    await db.georacingLine.destroy({ truncate: true });
    await db.georacingPosition.destroy({ truncate: true });
    await db.georacingSplittime.destroy({ truncate: true });
    await db.georacingSplittimeObject.destroy({ truncate: true });
    await db.georacingFailedUrl.destroy({ truncate: true });
    await db.georacingSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveGeoracingData({});
    expect(createActor).toHaveBeenCalledTimes(0);
    expect(createCourse).toHaveBeenCalledTimes(0);
    expect(createCE).toHaveBeenCalledTimes(0);
    expect(createCO).toHaveBeenCalledTimes(0);
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createGroundPlace).toHaveBeenCalledTimes(0);
    expect(createLine).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createSplittime).toHaveBeenCalledTimes(0);
    expect(createSO).toHaveBeenCalledTimes(0);
    expect(createWeather).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveGeoracingData(jsonData);
    expect(createActor).toHaveBeenCalledWith(
      jsonData.GeoracingActor,
      expect.anything(),
    );
    expect(createCourse).toHaveBeenCalledWith(
      jsonData.GeoracingCourse,
      expect.anything(),
    );
    expect(createCE).toHaveBeenCalledWith(
      jsonData.GeoracingCourseElement,
      expect.anything(),
    );
    expect(createCO).toHaveBeenCalledWith(
      jsonData.GeoracingCourseObject,
      expect.anything(),
    );
    expect(createEvent).toHaveBeenCalledWith(
      jsonData.GeoracingEvent,
      expect.anything(),
    );
    expect(createGroundPlace).toHaveBeenCalledWith(
      jsonData.GeoracingGroundPlace,
      expect.anything(),
    );
    expect(createLine).toHaveBeenCalledWith(
      jsonData.GeoracingLine,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.GeoracingPosition,
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      jsonData.GeoracingRace,
      expect.anything(),
    );
    expect(createSplittime).toHaveBeenCalledWith(
      jsonData.GeoracingSplittime,
      expect.anything(),
    );
    expect(createSO).toHaveBeenCalledWith(
      jsonData.GeoracingSplittimeObject,
      expect.anything(),
    );
    expect(createWeather).toHaveBeenCalledWith(
      jsonData.GeoracingWeather,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(
      process.env.GEO_DATA_SLICER ? 1 : 0,
    );
  });
});
