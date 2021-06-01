const db = require('../../models');
const {
  getRaces,
  getRegattas,
  getBoats,
  getDefaults,
  getFinishes,
  getMarks,
  getPositions,
  getStarts,
  processTackTrackerData,
} = require('../processTackTrackerData');
const saveTackTrackerData = require('../saveTackTrackerData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/tackTracker.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent TackTracker Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processTackTrackerData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist TackTracker Data from DB to Parquet', () => {
  const raceID1 = '8e555bca-e34b-4a3a-a552-34206c108563';
  const raceID2 = 'random';
  beforeAll(async () => {
    await saveTackTrackerData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.tackTrackerRegatta.destroy({
      truncate: true,
    });
    await db.tackTrackerRace.destroy({
      truncate: true,
    });
    await db.tackTrackerBoat.destroy({
      truncate: true,
    });
    await db.tackTrackerDefault.destroy({
      truncate: true,
    });
    await db.tackTrackerFinish.destroy({
      truncate: true,
    });
    await db.tackTrackerMark.destroy({
      truncate: true,
    });
    await db.tackTrackerPosition.destroy({
      truncate: true,
    });
    await db.tackTrackerStart.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(2);
  });
  it('should get regattas', async () => {
    const regattas = await getRegattas();
    expect(regattas.size).toEqual(1);
  });
  it('should get boats', async () => {
    const case1 = await getBoats([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getBoats([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get defaults', async () => {
    const case1 = await getDefaults([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);
    const case2 = await getDefaults([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get finish', async () => {
    const case1 = await getFinishes([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);
    const case2 = await getFinishes([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get marks', async () => {
    const case1 = await getMarks([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(4);
    const case2 = await getMarks([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get positions', async () => {
    const case1 = await getPositions([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(3);
    const case2 = await getPositions([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get starts', async () => {
    const case1 = await getStarts([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);
    const case2 = await getStarts([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/tackTracker/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processTackTrackerData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
