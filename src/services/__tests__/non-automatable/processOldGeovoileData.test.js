const db = require('../../../models');
const {
  getRaces,
  getObjectToRaceMapping,
  processOldGeovoile,
} = require('../../non-automatable/processOldGeovoile');
const normalizeObj = require('../../normalization/non-automatable/normalizeOldGeovoile');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveOldGeovoileData = require('../../non-automatable/saveOldGeovoileData');
const uploadUtil = require('../../uploadUtil');
const expectedRace = require('../../../test-files/old_geovoile/expectedRace.json');
const unzipFileUtil = require('../../../utils/unzipFile');

const temp = require('temp');
const path = require('path');

jest.mock('../../../utils/unzipFile');

describe('Processing non-existent Old Geovoile Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processOldGeovoile();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing existing OldGeovoile Data from DB to Parquet', () => {
  let race;
  let raceName;
  const oldGeovoileKeys = Object.keys(db).filter(
    (i) => i.indexOf('oldGeovoile') === 0,
  );
  beforeAll(async () => {
    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(
        path.join(__dirname, '..', '..', '..', 'test-files', 'old_geovoile'),
      );
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);
    await saveOldGeovoileData('databacklog', 'formatted_old_geovoille.zip');
    raceName = expectedRace.name;
    race = await db.oldGeovoileRace.findOne({
      where: { name: raceName },
    });
  });
  afterAll(async () => {
    for (key of oldGeovoileKeys) {
      await db[key].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(3);
    expect(races[0].name).toEqual(raceName);
  });
  it('should get boats', async () => {
    const boats = await getObjectToRaceMapping('oldGeovoileBoat', [race.id]);
    expect(boats.size).toEqual(1);
    expect(boats.get(race.id).length).toEqual(2);
  });

  it('should get boat positions', async () => {
    const boatPositions = await getObjectToRaceMapping(
      'oldGeovoileBoatPosition',
      [race.id],
    );
    expect(boatPositions.size).toEqual(1);
    expect(boatPositions.get(race.id).length).toEqual(4892);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/oldgeovoile/main.parquet',
      positionUrl:
        'https://awsbucket.com/thebucket/oldgeovoile/position.parquet',
    };
    const uploadSpy = jest
      .spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processOldGeovoile();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });

  it('It should delete db data after processing parquet', async () => {
    await processOldGeovoile();
    expect(await db.oldGeovoileRace.count({})).toEqual(0);
    expect(await db.oldGeovoileBoat.count({})).toEqual(0);
    expect(await db.oldGeovoileBoatPosition.count({})).toEqual(0);
  });
});
