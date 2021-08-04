const db = require('../../models');
const {
  getRaces,
  getRegattas,
  getBoats,
  getDefaults,
  getFinishes,
  getMarks,
  getStarts,
  processTackTrackerData,
} = require('../processTackTrackerData');
const normalizeObj = require('../normalization/normalizeTackTracker');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveTackTrackerData = require('../saveTackTrackerData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/tackTracker.json');

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
  const raceID1 = jsonData.TackTrackerRace[0].id;
  const raceID2 = 'random';
  beforeAll(async () => {
    await saveTackTrackerData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.tackTrackerRegatta.destroy({ truncate: true });
    await db.tackTrackerRace.destroy({ truncate: true });
    await db.tackTrackerBoat.destroy({ truncate: true });
    await db.tackTrackerDefault.destroy({ truncate: true });
    await db.tackTrackerFinish.destroy({ truncate: true });
    await db.tackTrackerMark.destroy({ truncate: true });
    await db.tackTrackerPosition.destroy({ truncate: true });
    await db.tackTrackerStart.destroy({ truncate: true });
    await db.tackTrackerSuccessfulUrl.destroy({ truncate: true });
    await db.tackTrackerFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(jsonData.TackTrackerRace.length);
  });
  it('should get regattas', async () => {
    const regattas = await getRegattas();
    expect(regattas.size).toEqual(jsonData.TackTrackerRegatta.length);
  });
  it('should get boats', async () => {
    const case1 = await getBoats([raceID1]);
    const expectedLength1 = jsonData.TackTrackerBoat.filter((r) => r.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength1);
    const case2 = await getBoats([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get defaults', async () => {
    const case1 = await getDefaults([raceID1]);
    const expectedLength1 = jsonData.TackTrackerDefault.filter((r) => r.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength1);
    const case2 = await getDefaults([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get finish', async () => {
    const case1 = await getFinishes([raceID1]);
    const expectedLength1 = jsonData.TackTrackerFinish.filter((r) => r.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength1);
    const case2 = await getFinishes([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get marks', async () => {
    const case1 = await getMarks([raceID1]);
    const expectedLength1 = jsonData.TackTrackerMark.filter((r) => r.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength1);
    const case2 = await getMarks([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get starts', async () => {
    const case1 = await getStarts([raceID1]);
    const expectedLength1 = jsonData.TackTrackerStart.filter((r) => r.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength1);
    const case2 = await getStarts([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/tacktracker/main.parquet',
      positionUrl:
        'https://awsbucket.com/thebucket/tacktracker/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processTackTrackerData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
