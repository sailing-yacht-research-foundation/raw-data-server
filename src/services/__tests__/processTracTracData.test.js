const db = require('../../models');
const {
  getEvents,
  getRaces,
  getClasses,
  getRaceClasses,
  getControls,
  getControlPoints,
  getControlPointPositions,
  getRoutes,
  getCompetitors,
  getCompetitorPassings,
  getCompetitorResults,
  processTracTracData,
} = require('../processTracTracData');
const saveTracTracData = require('../saveTracTracData');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/tractrac.json');

jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent trac trac Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processTracTracData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Trac Trac Data from DB to Parquet', () => {
  const raceID1 = '022e3341-0740-4714-b7e8-5bfcf9651b6f';
  const raceID2 = 'b6c5c72d-ec81-4dae-9c7b-a4675d12bb6d';
  const raceID3 = '263befab-00e9-47aa-8762-af035ace951b';
  beforeAll(async () => {
    await saveTracTracData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.tractracEvent.destroy({ truncate: true });
    await db.tractracRace.destroy({ truncate: true });
    await db.tractracClass.destroy({ truncate: true });
    await db.tractracRaceClass.destroy({ truncate: true });
    await db.tractracClass.destroy({ truncate: true });
    await db.tractracCompetitor.destroy({ truncate: true });
    await db.tractracCompetitorPassing.destroy({ truncate: true });
    await db.tractracCompetitorPosition.destroy({ truncate: true });
    await db.tractracCompetitorResult.destroy({ truncate: true });
    await db.tractracControl.destroy({ truncate: true });
    await db.tractracControlPoint.destroy({ truncate: true });
    await db.tractracControlPointPosition.destroy({ truncate: true });
    await db.tractracRoute.destroy({ truncate: true });
    await db.sailorEmail.destroy({ truncate: true });
    await db.tractracFailedUrl.destroy({ truncate: true });
    await db.tractracSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get events', async () => {
    const events = await getEvents();
    expect(events.size).toEqual(1);
  });
  it('should get classes', async () => {
    const classes = await getClasses();
    expect(classes.size).toEqual(11);
  });
  it('should get races correctly', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(5);
  });
  it('should get routes correctly', async () => {
    const routes = await getRoutes([raceID1]);
    expect(routes.size).toEqual(1);

    const secondRoutes = await getRoutes([raceID1, raceID2]);
    expect(secondRoutes.size).toEqual(2);
  });
  it('should get race classes correctly', async () => {
    const result1 = await getRaceClasses([raceID1]);
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(9);

    const result2 = await getRaceClasses([raceID2]);
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(9);
  });
  it('should get race competitors correctly', async () => {
    const result1 = await getCompetitors([raceID1]);
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(3);

    const result2 = await getCompetitors([raceID2]);
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(2);
  });
  it('should get race competitor results correctly', async () => {
    const result1 = await getCompetitorResults([raceID1]);
    expect(result1.size).toEqual(0);

    const result2 = await getCompetitorResults([raceID2]);
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(2);
  });
  it('should get race competitor passings correctly', async () => {
    const result1 = await getCompetitorPassings([raceID1]);
    expect(result1.size).toEqual(0);

    const result2 = await getCompetitorPassings([raceID3]);
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID3).length).toEqual(3);
  });

  it('should get race controls correctly', async () => {
    const result1 = await getControls([raceID1]);
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(4);

    const result2 = await getControls([raceID2]);
    expect(result2.size).toEqual(0);
  });
  it('should get race control points correctly', async () => {
    const result1 = await getControlPoints([raceID1]);
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(5);

    const result2 = await getControlPoints([raceID2]);
    expect(result2.size).toEqual(0);
  });
  it('should get race control point positions correctly', async () => {
    const result1 = await getControlPointPositions([raceID1]);
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(3);

    const result2 = await getControlPointPositions([raceID2]);
    expect(result2.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/tractrac/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/tractrac/position.parquet',
    };
    uploadFileToS3
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processTracTracData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
