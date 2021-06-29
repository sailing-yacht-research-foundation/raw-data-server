const db = require('../../models');
const {
  getRaces,
  getBoats,
  getBoatHandicaps,
  getBoatSocialMedias,
  getCrews,
  getCrewSocialMedias,
  getMaps,
  getPositions,
  getAnnouncements,
  processBluewaterData,
} = require('../processBluewaterData');
const saveBluewaterData = require('../saveBluewaterData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/bluewater.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent Bluewater Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processBluewaterData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Bluewater Data from DB to Parquet', () => {
  const raceID = '74314800-9ccb-4f52-a37f-82e01b2afe80';
  const crewID = '3a2f9249-084b-4d95-b639-fcc7d1336d6c';
  const boatID = '4bcb53b4-058f-4c2b-a41c-5b607730765e';
  beforeAll(async () => {
    await saveBluewaterData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.bluewaterRace.destroy({ truncate: true });
    await db.bluewaterBoat.destroy({ truncate: true });
    await db.bluewaterBoatHandicap.destroy({ truncate: true });
    await db.bluewaterBoatSocialMedia.destroy({ truncate: true });
    await db.bluewaterCrew.destroy({ truncate: true });
    await db.bluewaterCrewSocialMedia.destroy({ truncate: true });
    await db.bluewaterMap.destroy({ truncate: true });
    await db.bluewaterPosition.destroy({ truncate: true });
    await db.bluewaterAnnouncement.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(1);
    expect(races[0].id).toEqual(raceID);
  });
  it('should get boats', async () => {
    const { mapBoats, boatList } = await getBoats([raceID]);
    expect(mapBoats.size).toEqual(1);
    expect(mapBoats.get(raceID).length).toEqual(2);
    expect(boatList.length).toEqual(2);
  });
  it('should get boat handicaps', async () => {
    const handicaps = await getBoatHandicaps([boatID]);
    expect(handicaps.size).toEqual(1);
    expect(handicaps.get(boatID).length).toEqual(2);
  });
  it('should get boat social medias', async () => {
    const socMeds = await getBoatSocialMedias([raceID]);
    expect(socMeds.size).toEqual(1);
    expect(socMeds.get(raceID).length).toEqual(1);
  });
  it('should get crews', async () => {
    const { crewList, mapCrews } = await getCrews([raceID]);
    expect(mapCrews.size).toEqual(1);
    expect(mapCrews.get(raceID).length).toEqual(3);
    expect(crewList.length).toEqual(3);
  });
  it('should get crew social medias', async () => {
    const socMeds = await getCrewSocialMedias([crewID]);
    expect(socMeds.size).toEqual(1);
    expect(socMeds.get(crewID).length).toEqual(1);
  });
  it('should get maps', async () => {
    const maps = await getMaps([raceID]);
    expect(maps.size).toEqual(1);
    expect(maps.get(raceID).length).toEqual(1);
  });
  it('should get positions', async () => {
    const positions = await getPositions([raceID]);
    expect(positions.size).toEqual(1);
    expect(positions.get(raceID).length).toEqual(4);
  });
  it('should get positions', async () => {
    const announcements = await getAnnouncements([raceID]);
    expect(announcements.size).toEqual(1);
    expect(announcements.get(raceID).length).toEqual(1);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/bluewater/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processBluewaterData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
