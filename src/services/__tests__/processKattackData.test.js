const db = require('../../models');
const {
  getYachtClubs,
  getRaces,
  getDevices,
  getPositions,
  getWaypoints,
  processKattackData,
} = require('../processKattackData');
const saveKattackData = require('../saveKattackData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/kattack.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent kattack Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
    await db.kattackYachtClub.destroy({
      truncate: true,
    });
  });
  it('should not get any yacht clubs', async () => {
    const clubs = await getYachtClubs();
    expect(clubs.size).toEqual(0);
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
  const raceID = '79722f12-5f07-43a1-a327-08459673802d';
  beforeAll(async () => {
    await saveKattackData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.kattackYachtClub.destroy({
      truncate: true,
    });
    await db.kattackRace.destroy({
      truncate: true,
    });
    await db.kattackDevice.destroy({
      truncate: true,
    });
    await db.kattackPosition.destroy({
      truncate: true,
    });
    await db.kattackWaypoint.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get yacht clubs correctly', async () => {
    const clubs = await getYachtClubs();
    expect(clubs.size).toEqual(2);
  });
  it('should get races correctly', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(2);
  });
  it('should get devices correctly', async () => {
    const devices = await getDevices([raceID]);
    expect(devices.size).toEqual(1);
    expect(devices.get(raceID).length).toEqual(1);
  });
  it('should get positions correctly', async () => {
    const positions = await getPositions([raceID]);
    expect(positions.size).toEqual(1);
    expect(positions.get(raceID).length).toEqual(1);
  });
  it('should get waypoints correctly', async () => {
    const waypoints = await getWaypoints([raceID]);
    expect(waypoints.size).toEqual(1);
    expect(waypoints.get(raceID).length).toEqual(2);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/kattack/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processKattackData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
