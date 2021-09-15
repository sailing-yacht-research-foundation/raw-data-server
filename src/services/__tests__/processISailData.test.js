const db = require('../../models');
const {
  getParticipants,
  getEventTrackData,
  getEventTracks,
  getRoundings,
  getRaces,
  getMarks,
  getStartlines,
  getCourseMarks,
  getResults,
  processISailData,
} = require('../processISailData');
const normalizeObj = require('../normalization/normalizeISail');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveISailData = require('../saveISailData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/iSail.json');

describe('Processing non-existent iSail Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any event participants', async () => {
    const eventID = 'ddfd5dea-0bbf-11ec-9a03-0242ac130003';
    const participants = await getParticipants([eventID]);
    expect(participants.size).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processISailData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist iSail Data from DB to Parquet', () => {
  const eventID = jsonData.iSailEvent[0].id;

  beforeAll(async () => {
    await saveISailData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.iSailClass.destroy({ truncate: true });
    await db.iSailEvent.destroy({ truncate: true });
    await db.iSailRace.destroy({ truncate: true });
    await db.iSailEventParticipant.destroy({ truncate: true });
    await db.iSailEventTracksData.destroy({ truncate: true });
    await db.iSailPosition.destroy({ truncate: true });
    await db.iSailTrack.destroy({ truncate: true });
    await db.iSailMark.destroy({ truncate: true });
    await db.iSailStartline.destroy({ truncate: true });
    await db.iSailCourseMark.destroy({ truncate: true });
    await db.iSailRounding.destroy({ truncate: true });
    await db.iSailResult.destroy({ truncate: true });
    await db.iSailFailedUrl.destroy({ truncate: true });
    await db.iSailSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get event participants correctly', async () => {
    const participants = await getParticipants([eventID]);
    const expectedLength = jsonData.iSailEventParticipant.filter((p) => p.event === eventID).length;
    expect(participants.size).toEqual(1);
    expect(participants.get(eventID).length).toEqual(expectedLength);
  });
  it('should get event track data correctly', async () => {
    const trackDatas = await getEventTrackData([eventID]);
    const expectedTracksData = jsonData.iSailEventTracksData.find((p) => p.event === eventID);
    expect(trackDatas.get(eventID)).toBeDefined();
    expect(trackDatas.get(eventID)).toHaveProperty('min_lon', expectedTracksData.min_lon);
  });
  it('should get event tracks correctly', async () => {
    const tracks = await getEventTracks([eventID]);
    const expectedLength = jsonData.iSailTrack.filter((p) => p.event === eventID).length;
    expect(tracks.size).toEqual(1);
    expect(tracks.get(eventID).length).toEqual(expectedLength);
  });
  it('should get roundings correctly', async () => {
    const roundings = await getRoundings([eventID]);
    const expectedLength = jsonData.iSailRounding.filter((p) => p.event === eventID).length;
    expect(roundings.size).toEqual(1);
    expect(roundings.get(eventID).length).toEqual(expectedLength);
  });
  it('should get races correctly', async () => {
    const races = await getRaces([eventID]);
    const expectedLength = jsonData.iSailRace.filter((p) => p.event === eventID).length;
    expect(races.size).toEqual(1);
    expect(races.get(eventID).length).toEqual(expectedLength);
  });
  it('should get marks correctly', async () => {
    const marks = await getMarks([eventID]);
    const expectedLength = jsonData.iSailMark.filter((p) => p.event === eventID).length;
    expect(marks.size).toEqual(1);
    expect(marks.get(eventID).length).toEqual(expectedLength);
  });
  it('should get startlines correctly', async () => {
    const startlines = await getStartlines([eventID]);
    const expectedLength = jsonData.iSailStartline.filter((p) => p.event === eventID).length;
    expect(startlines.size).toEqual(1);
    expect(startlines.get(eventID).length).toEqual(expectedLength);
  });
  it('should get course marks correctly', async () => {
    const courseMarks = await getCourseMarks([eventID]);
    const expectedLength = jsonData.iSailCourseMark.filter((p) => p.event === eventID).length;
    expect(courseMarks.size).toEqual(1);
    expect(courseMarks.get(eventID).length).toEqual(expectedLength);
  });
  it('should get results correctly', async () => {
    const results = await getResults([eventID]);
    const expectedLength = jsonData.iSailResult.filter((p) => p.event === eventID).length;
    expect(results.size).toEqual(1);
    expect(results.get(eventID).length).toEqual(expectedLength);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/isail/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/isail/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processISailData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
