const db = require('../../models');
const {
  getParticipants,
  getEventTrackData,
  getEventTracks,
  getPositions,
  getRoundings,
  getRaces,
  getMarks,
  getStartlines,
  getCourseMarks,
  getResults,
  processISailData,
} = require('../processISailData');
const saveISailData = require('../saveISailData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/iSail.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent iSail Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any event participants', async () => {
    const eventID = 'random-id';
    const participants = await getParticipants([eventID]);
    expect(participants.size).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processISailData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist iSail Data from DB to Parquet', () => {
  beforeAll(async () => {
    await saveISailData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.iSailClass.destroy({
      truncate: true,
    });
    await db.iSailEvent.destroy({
      truncate: true,
    });
    await db.iSailRace.destroy({
      truncate: true,
    });
    await db.iSailEventParticipant.destroy({
      truncate: true,
    });
    await db.iSailEventTracksData.destroy({
      truncate: true,
    });
    await db.iSailPosition.destroy({
      truncate: true,
    });
    await db.iSailTrack.destroy({
      truncate: true,
    });
    await db.iSailMark.destroy({
      truncate: true,
    });
    await db.iSailStartline.destroy({
      truncate: true,
    });
    await db.iSailCourseMark.destroy({
      truncate: true,
    });
    await db.iSailRounding.destroy({
      truncate: true,
    });
    await db.iSailResult.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get event participants correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const participants = await getParticipants([eventID]);
    expect(participants.size).toEqual(1);
    expect(participants.get(eventID).length).toEqual(4);
  });
  it('should get event track data correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const trackDatas = await getEventTrackData([eventID]);
    expect(trackDatas.get(eventID)).toBeDefined();
    expect(trackDatas.get(eventID)).toHaveProperty('min_lon', '4.639424');
  });
  it('should get event tracks correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const tracks = await getEventTracks([eventID]);
    expect(tracks.size).toEqual(1);
    expect(tracks.get(eventID).length).toEqual(4);
  });
  it('should get positions correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const positions = await getPositions([eventID]);
    expect(positions.size).toEqual(1);
    expect(positions.get(eventID).length).toEqual(100);
  });
  it('should get roundings correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const roundings = await getRoundings([eventID]);
    expect(roundings.size).toEqual(1);
    expect(roundings.get(eventID).length).toEqual(1);
  });
  it('should get races correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const races = await getRaces([eventID]);
    expect(races.size).toEqual(1);
    expect(races.get(eventID).length).toEqual(2);
  });
  it('should get marks correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const marks = await getMarks([eventID]);
    expect(marks.size).toEqual(1);
    expect(marks.get(eventID).length).toEqual(1);
  });
  it('should get startlines correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const startlines = await getStartlines([eventID]);
    expect(startlines.size).toEqual(1);
    expect(startlines.get(eventID).length).toEqual(1);
  });
  it('should get course marks correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const courseMarks = await getCourseMarks([eventID]);
    expect(courseMarks.size).toEqual(1);
    expect(courseMarks.get(eventID).length).toEqual(1);
  });
  it('should get results correctly', async () => {
    const eventID = 'd451063e-b576-4b23-8638-457e68cb6c26';
    const results = await getResults([eventID]);
    expect(results.size).toEqual(1);
    expect(results.get(eventID).length).toEqual(1);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/isail/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processISailData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
