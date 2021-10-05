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
  getSplittime,
  getSplittimeObjects,
  processGeoracingData,
} = require('../processGeoracingData');
const normalizeObj = require('../normalization/normalizeGeoracing');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveGeoracingData = require('../saveGeoracingData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/georacing.json');

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
  const eventID = jsonData.GeoracingEvent[0].id;
  const raceID = jsonData.GeoracingRace[0].id;
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
    const expectedLength = jsonData.GeoracingEvent.length;
    expect(events.length).toEqual(expectedLength);
  });
  it('should get races correctly', async () => {
    const { raceIDs, raceMap } = await getRaces([eventID]);
    const expectedLength = jsonData.GeoracingRace.filter((p) => p.event === eventID).length;
    expect(raceMap.size).toEqual(expectedLength);
    expect(raceIDs.length).toEqual(expectedLength);
  });
  it('should get actors correctly', async () => {
    const actors = await getActors([eventID]);
    const expectedLength = jsonData.GeoracingActor.filter((p) => p.event === eventID).length;
    expect(actors.size).toEqual(1);
    expect(actors.get(eventID).length).toEqual(expectedLength);
  });
  it('should get weathers correctly', async () => {
    const weathers = await getWeathers([raceID]);
    const expectedLength = jsonData.GeoracingWeather.filter((p) => p.race === raceID).length;
    expect(weathers.size).toEqual(1);
    expect(weathers.get(raceID).length).toEqual(expectedLength);
  });
  it('should get courses correctly', async () => {
    const positions = await getCourses([raceID]);
    const expectedLength = jsonData.GeoracingCourse.filter((p) => p.race === raceID).length;
    expect(positions.size).toEqual(1);
    expect(positions.get(raceID).length).toEqual(expectedLength);
  });
  it('should get course object correctly', async () => {
    const objects = await getCourseObjects([raceID]);
    const expectedLength = jsonData.GeoracingCourseObject.filter((p) => p.race === raceID).length;
    expect(objects.size).toEqual(1);
    expect(objects.get(raceID).length).toEqual(expectedLength);
  });
  it('should get course element correctly', async () => {
    const elements = await getCourseElements([raceID]);
    const expectedLength = jsonData.GeoracingCourseElement.filter((p) => p.race === raceID).length;
    expect(elements.size).toEqual(1);
    expect(elements.get(raceID).length).toEqual(expectedLength);
  });
  it('should get ground place correctly', async () => {
    const groundPlaces = await getGroundPlace([raceID]);
    const expectedLength = jsonData.GeoracingGroundPlace.filter((p) => p.race === raceID).length;
    expect(groundPlaces.size).toEqual(1);
    expect(groundPlaces.get(raceID).length).toEqual(expectedLength);
  });
  it('should get lines correctly', async () => {
    const lines = await getLines([raceID]);
    const expectedLength = jsonData.GeoracingLine.filter((p) => p.race === raceID).length;
    expect(lines.size).toEqual(1);
    expect(lines.get(raceID).length).toEqual(expectedLength);
  });
  it('should get splittimes correctly', async () => {
    const { splittimeIDs, splittimeMap } = await getSplittime([eventID]);
    const expectedLength = jsonData.GeoracingSplittime.filter((p) => p.race === raceID).length;
    expect(splittimeMap.size).toEqual(expectedLength);
    expect(splittimeIDs.length).toEqual(expectedLength);
  });
  it('should get splittime objects correctly', async () => {
    const splittimeId = jsonData.GeoracingSplittime[0].id;
    const objects = await getSplittimeObjects([splittimeId]);
    const expectedLength = jsonData.GeoracingSplittimeObject.filter((p) => p.splittime === splittimeId).length;
    expect(objects.size).toEqual(1);
    expect(objects.get(splittimeId).length).toEqual(expectedLength);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/georacing/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/georacing/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processGeoracingData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
