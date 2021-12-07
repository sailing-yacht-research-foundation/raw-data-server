const db = require('../../models');
const {
  getRaces,
  getBoats,
  getSailors,
  processGeovoileData,
} = require('../processGeovoileData');
const normalizeObj = require('../normalization/normalizeGeovoile');
jest
  .spyOn(normalizeObj, 'normalizeGeovoile')
  .mockImplementation(() => Promise.resolve());
const savegeovoileData = require('../saveGeovoileData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/save-geovoile-modern.json');

describe('Processing non-existent geovoile Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any race', async () => {
    const events = await getRaces();
    expect(events.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processGeovoileData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist geovoile Data from DB to Parquet', () => {
  let raceID;
  beforeAll(async () => {
    await savegeovoileData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.geovoileRace.destroy({
      truncate: true,
    });
    await db.geovoileBoat.destroy({
      truncate: true,
    });
    await db.geovoileBoatPosition.destroy({
      truncate: true,
    });
    await db.geovoileBoatSailor.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });

  it('should get races correctly', async () => {
    const races = await getRaces();
    raceID = races[0].id;
    expect(races.length).toEqual(1);
  });
  it('should getBoats correctly', async () => {
    const boats = await getBoats([raceID]);
    const expectedLength = jsonData.boats.length;
    expect(boats.size).toEqual(1);
    expect(boats.get(raceID).length).toEqual(expectedLength);
  });
  it('should getSailors correctly', async () => {
    const boatSailorMap = await getSailors([raceID]);
    const numberOfBoats = jsonData.boats.length;
    expect(boatSailorMap.size).toEqual(numberOfBoats);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/geovoile/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/geovoile/position.parquet',
    };
    const uploadSpy = jest
      .spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processGeovoileData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
