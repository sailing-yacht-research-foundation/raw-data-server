const db = require('../../models');
const {
  getRaces,
  getBuoys,
  getYachts,
  getPositions,
  processYachtBotData,
} = require('../processYachtBotData');
const saveYachtBotData = require('../saveYachtBotData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/yachtbot.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent YachtBot Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processYachtBotData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist YachtBot Data from DB to Parquet', () => {
  const raceID1 = '2f052217-bd51-4428-b772-5a0ca8659c77';
  const raceID2 = '22af95d6-8c45-4532-abc2-d2a41f6744b7';
  beforeAll(async () => {
    await saveYachtBotData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.yachtBotRace.destroy({
      truncate: true,
    });
    await db.yachtBotBuoy.destroy({
      truncate: true,
    });
    await db.yachtBotPosition.destroy({
      truncate: true,
    });
    await db.yachtBotYacht.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(2);
  });
  it('should get buoys', async () => {
    const case1 = await getBuoys([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(3);
    const case2 = await getBuoys([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get yachts', async () => {
    const case1 = await getYachts([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getYachts([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get positions', async () => {
    const case1 = await getPositions([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(5);
    const case2 = await getPositions([raceID2]);
    expect(case2.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/yachtbot/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processYachtBotData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
