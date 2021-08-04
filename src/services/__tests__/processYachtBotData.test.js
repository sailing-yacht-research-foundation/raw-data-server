const db = require('../../models');
const {
  getRaces,
  getBuoys,
  getYachts,
  processYachtBotData,
} = require('../processYachtBotData');
const normalizeObj = require('../normalization/normalizeYachtBot');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveYachtBotData = require('../saveYachtBotData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/yachtbot.json');

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
    await db.yachtBotRace.destroy({ truncate: true });
    await db.yachtBotBuoy.destroy({ truncate: true });
    await db.yachtBotPosition.destroy({ truncate: true });
    await db.yachtBotYacht.destroy({ truncate: true });
    await db.yachtBotSuccessfulUrl.destroy({ truncate: true });
    await db.yachtBotFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(1);
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

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/yachtbot/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/yachtbot/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processYachtBotData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
