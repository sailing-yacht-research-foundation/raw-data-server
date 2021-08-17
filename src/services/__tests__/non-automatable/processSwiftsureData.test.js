const db = require('../../../models');
const {
  getRaces,
  getObjectToRaceMapping,
  processSwiftsureData,
} = require('../../non-automatable/processSwiftsureData');
const normalizeObj = require('../../normalization/normalizeSwiftsure');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveSwiftsureData = require('../../non-automatable/saveSwiftsureData');
const uploadUtil = require('../../uploadUtil');
const jsonData = require('../../../test-files/swiftsure.json');

describe('Processing non-existent Swiftsure Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processSwiftsureData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Swiftsure Data from DB to Parquet', () => {
  const swiftsureKeys = Object.keys(db).filter((i) => i.indexOf('swiftsure') === 0);
  beforeAll(async () => {
    await saveSwiftsureData(jsonData);
  });
  afterAll(async () => {
    for (key of swiftsureKeys) {
      await db[key].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(jsonData.SwiftsureRace.length);
    expect(races[0].id).toEqual(jsonData.SwiftsureRace[0].id);
  });
  it('should get boats', async () => {
    const raceID = jsonData.SwiftsureRace[0].id;
    const boats = await getObjectToRaceMapping('swiftsureBoat', [raceID] );
    const expectedLength = jsonData.SwiftsureBoat.filter((p) => p.race === raceID).length;
    expect(boats.size).toEqual(1);
    expect(boats.get(raceID).length).toEqual(expectedLength);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/swiftsure/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/swiftsure/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processSwiftsureData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
