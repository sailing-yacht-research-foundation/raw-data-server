const db = require('../../models');
const saveGeoracingData = require('../saveGeoracingData');

const jsonData = require('../../test-files/georacing.json');

describe('Storing georacing data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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

  it('should not save anything when empty data', async () => {
    const createActor = jest.spyOn(db.georacingActor, 'bulkCreate');
    const createCourse = jest.spyOn(db.georacingCourse, 'bulkCreate');
    const createCE = jest.spyOn(db.georacingCourseElement, 'bulkCreate');
    const createCO = jest.spyOn(db.georacingCourseObject, 'bulkCreate');
    const createEvent = jest.spyOn(db.georacingEvent, 'bulkCreate');
    const createGroundPlace = jest.spyOn(db.georacingGroundPlace, 'bulkCreate');
    const createLine = jest.spyOn(db.georacingLine, 'bulkCreate');
    const createPosition = jest.spyOn(db.georacingPosition, 'bulkCreate');
    const createRace = jest.spyOn(db.georacingRace, 'bulkCreate');
    const createSplittime = jest.spyOn(db.georacingSplittime, 'bulkCreate');
    const createSO = jest.spyOn(db.georacingSplittimeObject, 'bulkCreate');
    const createWeather = jest.spyOn(db.georacingWeather, 'bulkCreate');
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
  });
  it('should save data correctly', async () => {
    const createActor = jest.spyOn(db.georacingActor, 'bulkCreate');
    const createCourse = jest.spyOn(db.georacingCourse, 'bulkCreate');
    const createCE = jest.spyOn(db.georacingCourseElement, 'bulkCreate');
    const createCO = jest.spyOn(db.georacingCourseObject, 'bulkCreate');
    const createEvent = jest.spyOn(db.georacingEvent, 'bulkCreate');
    const createGroundPlace = jest.spyOn(db.georacingGroundPlace, 'bulkCreate');
    const createLine = jest.spyOn(db.georacingLine, 'bulkCreate');
    const createPosition = jest.spyOn(db.georacingPosition, 'bulkCreate');
    const createRace = jest.spyOn(db.georacingRace, 'bulkCreate');
    const createSplittime = jest.spyOn(db.georacingSplittime, 'bulkCreate');
    const createSO = jest.spyOn(db.georacingSplittimeObject, 'bulkCreate');
    const createWeather = jest.spyOn(db.georacingWeather, 'bulkCreate');
    await saveGeoracingData(jsonData);
    expect(createActor).toHaveBeenCalledTimes(1);
    expect(createCourse).toHaveBeenCalledTimes(1);
    expect(createCE).toHaveBeenCalledTimes(1);
    expect(createCO).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createGroundPlace).toHaveBeenCalledTimes(1);
    expect(createLine).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createSplittime).toHaveBeenCalledTimes(1);
    expect(createSO).toHaveBeenCalledTimes(1);
    expect(createWeather).toHaveBeenCalledTimes(1);
  });
  it('should rollback data when one fails to execute', async () => {
    await db.georacingRace.destroy({ truncate: true });
    const initialRaceCount = 0;
    const invalidData = Object.assign({}, jsonData);
    invalidData.GeoracingRace = [
      ...invalidData.GeoracingRace,
      {
        original_id: '97712',
        event: '8fd17e9c-bce2-45ea-9c63-1eca69963e18',
        url: 'https://tracker2021.qrillpaws.net/iditarod.html',
      },
    ];
    const response = await saveGeoracingData(invalidData);
    const raceCount = await db.georacingRace.count();
    expect(raceCount).toEqual(initialRaceCount);
    expect(response).toEqual(expect.stringContaining('notNull Violation'));
  });
});
