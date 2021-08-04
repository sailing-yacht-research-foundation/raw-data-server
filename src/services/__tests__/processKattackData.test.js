const db = require('../../models');
const {
  getYachtClubs,
  getRaces,
  getDevices,
  getWaypoints,
  processKattackData,
} = require('../processKattackData');
const normalizeObj = require('../normalization/normalizeKattack');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveKattackData = require('../saveKattackData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/kattack.json');

describe('Processing non-existent kattack Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });
  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processKattackData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist kattack Data from DB to Parquet', () => {
  const raceID = jsonData.KattackRace[0].id;
  beforeAll(async () => {
    await saveKattackData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.kattackYachtClub.destroy({ truncate: true });
    await db.kattackRace.destroy({ truncate: true });
    await db.kattackDevice.destroy({ truncate: true });
    await db.kattackPosition.destroy({ truncate: true });
    await db.kattackWaypoint.destroy({ truncate: true });
    await db.kattackSuccessfulUrl.destroy({ truncate: true });
    await db.kattackFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get yacht clubs correctly', async () => {
    const clubs = await getYachtClubs();
    const expectedLength = jsonData.KattackYachtClub.length;
    expect(clubs.size).toEqual(expectedLength);
  });
  it('should get races correctly', async () => {
    const races = await getRaces();
    const expectedLength = jsonData.KattackRace.length;
    expect(races.length).toEqual(expectedLength);
  });
  it('should get devices correctly', async () => {
    const devices = await getDevices([raceID]);
    const expectedLength = jsonData.KattackDevice.filter((p) => p.race === raceID).length;
    expect(devices.size).toEqual(1);
    expect(devices.get(raceID).length).toEqual(expectedLength);
  });
  it('should get waypoints correctly', async () => {
    const waypoints = await getWaypoints([raceID]);
    const expectedLength = jsonData.KattackWaypoint.filter((p) => p.race === raceID).length;
    expect(waypoints.size).toEqual(1);
    expect(waypoints.get(raceID).length).toEqual(expectedLength);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/kattack/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/kattack/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processKattackData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
