const db = require('../../../models');
const {
  getRaces,
  getObjectToRaceMapping,
  processSapData,
} = require('../../non-automatable/processSapData');
const normalizeObj = require('../../normalization/non-automatable/normalizeSap');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveSapData = require('../../non-automatable/saveSapData');
const uploadUtil = require('../../uploadUtil');
const unzipFileUtil = require('../../../utils/unzipFile');
const expectedRace = require('./../../../test-files/sap/data/expectedRace.json');
const temp = require('temp');
const path = require('path');

jest.mock('../../../utils/unzipFile');

describe('Processing non-existent AmericasCup2021 Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processSapData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing existing SAP Data from DB to Parquet', () => {
  let race;
  let raceID;
  const sapKeys = Object.keys(db).filter((i) => i.indexOf('sap') === 0);
  beforeAll(async () => {
    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(
        path.join(__dirname, '..', '..', '..', 'test-files', 'sap'),
      );
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);
    await saveSapData('databacklog', 'SAP-TEST.zip');
    raceID = expectedRace.original_id;
    race = await db.sapRace.findOne({
      where: { original_id: raceID },
    });
  });
  afterAll(async () => {
    for (key of sapKeys) {
      await db[key].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(1);
    expect(races[0].original_id).toEqual(raceID);
  });
  it('should get boats', async () => {
    const boats = await getObjectToRaceMapping('sapCompetitorBoat', [race.id]);
    expect(boats.size).toEqual(1);
    expect(boats.get(race.id).length).toEqual(6);
  });

  it('should get boat positions', async () => {
    const boatPositions = await getObjectToRaceMapping(
      'sapCompetitorBoatPosition',
      [race.id],
    );
    expect(boatPositions.size).toEqual(1);
    expect(boatPositions.get(race.id).length).toEqual(60);
  });
  it('should get competitors', async () => {
    const competitors = await getObjectToRaceMapping('sapCompetitor', [
      race.id,
    ]);
    expect(competitors.size).toEqual(1);
    expect(competitors.get(race.id).length).toEqual(18);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/sap/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/sap/position.parquet',
      markUrl: 'https://awsbucket.com/thebucket/sap/mark.parquet',
    };
    const uploadSpy = jest
      .spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.markUrl);

    const fileUrl = await processSapData();
    expect(uploadSpy).toHaveBeenCalledTimes(3);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });

  it('It should delete db data after processing parquet', async () => {
    await processSapData();
    expect(await db.sapRace.count({})).toEqual(0);
    expect(await db.sapCompetitor.count({})).toEqual(0);
    expect(await db.sapCompetitorBoat.count({})).toEqual(0);
    expect(await db.sapCompetitorBoatPosition.count({})).toEqual(0);
    expect(await db.sapCompetitorLeg.count({})).toEqual(0);
    expect(await db.sapCompetitorManeuver.count({})).toEqual(0);
    expect(await db.sapCompetitorMarkPassing.count({})).toEqual(0);
    expect(await db.sapCompetitorMarkPosition.count({})).toEqual(0);
    expect(await db.sapCourse.count({})).toEqual(0);
    expect(await db.sapMark.count({})).toEqual(0);
    expect(await db.sapTargetTimeLeg.count({})).toEqual(0);
    expect(await db.sapWindSummary.count({})).toEqual(0);
  });
});
