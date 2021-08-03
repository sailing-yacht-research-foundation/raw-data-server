const db = require('../../models');
const {
  getRaces,
  getBoats,
  getBoatHandicaps,
  getBoatSocialMedias,
  getCrews,
  getCrewSocialMedias,
  getMaps,
  getAnnouncements,
  processBluewaterData,
} = require('../processBluewaterData');
const normalizeObj = require('../normalization/normalizeBluewater');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveBluewaterData = require('../saveBluewaterData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/bluewater.json');

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
    await db.bluewaterSuccessfulUrl.destroy({ truncate: true });
    await db.bluewaterFailedUrl.destroy({ truncate: true });
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
    const announcements = await getAnnouncements([raceID]);
    expect(announcements.size).toEqual(1);
    expect(announcements.get(raceID).length).toEqual(1);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/bluewater/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/bluewater/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processBluewaterData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
