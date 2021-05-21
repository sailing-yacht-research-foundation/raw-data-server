const db = require('../../models');
const {
  getEvents,
  getRaces,
  getActors,
  getWeathers,
  getCourses,
  getCourseObjects,
  getCourseElements,
  getGroundPlace,
  getLines,
  getPositions,
  getSplittime,
  getSplittimeObjects,
  processGeoracingData,
} = require('../processGeoracingData');
const saveGeoracingData = require('../saveGeoracingData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/georacing.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent georacing Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any event', async () => {
    const events = await getEvents();
    expect(events.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processGeoracingData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist georacing Data from DB to Parquet', () => {
  const eventID = '8fd17e9c-bce2-45ea-9c63-1eca69963e18';
  const raceID = 'ecd58518-3ad9-4139-a46c-222ee7f4ae4f';
  beforeAll(async () => {
    await saveGeoracingData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
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
  it('should get events', async () => {
    const events = await getEvents();
    expect(events.length).toEqual(2);
  });
  it('should get races correctly', async () => {
    const { raceIDs, raceMap } = await getRaces([eventID]);
    expect(raceMap.size).toEqual(1);
    expect(raceIDs.length).toEqual(1);
  });
  it('should get actors correctly', async () => {
    const actors = await getActors([eventID]);
    expect(actors.size).toEqual(1);
    expect(actors.get(eventID).length).toEqual(2);
  });
  it('should get positions correctly', async () => {
    const positions = await getPositions([eventID]);
    expect(positions.size).toEqual(1);
    expect(positions.get(eventID).length).toEqual(1);
  });
  it('should get weathers correctly', async () => {
    const weathers = await getWeathers([raceID]);
    expect(weathers.size).toEqual(1);
    expect(weathers.get(raceID).length).toEqual(1);
  });
  it('should get courses correctly', async () => {
    const positions = await getCourses([raceID]);
    expect(positions.size).toEqual(1);
    expect(positions.get(raceID).length).toEqual(1);
  });
  it('should get course object correctly', async () => {
    const objects = await getCourseObjects([raceID]);
    expect(objects.size).toEqual(1);
    expect(objects.get(raceID).length).toEqual(1);
  });
  it('should get course element correctly', async () => {
    const elements = await getCourseElements([raceID]);
    expect(elements.size).toEqual(1);
    expect(elements.get(raceID).length).toEqual(1);
  });
  it('should get ground place correctly', async () => {
    const groundPlaces = await getGroundPlace([raceID]);
    expect(groundPlaces.size).toEqual(1);
    expect(groundPlaces.get(raceID).length).toEqual(2);
  });
  it('should get lines correctly', async () => {
    const lines = await getLines([raceID]);
    expect(lines.size).toEqual(1);
    expect(lines.get(raceID).length).toEqual(1);
  });
  it('should get splittimes correctly', async () => {
    const { splittimeIDs, splittimeMap } = await getSplittime([eventID]);
    expect(splittimeMap.size).toEqual(1);
    expect(splittimeIDs.length).toEqual(1);
  });
  it('should get splittime objects correctly', async () => {
    const objects = await getSplittimeObjects(['spt1']);
    expect(objects.size).toEqual(1);
    expect(objects.get('spt1').length).toEqual(1);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/georacing/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processGeoracingData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
