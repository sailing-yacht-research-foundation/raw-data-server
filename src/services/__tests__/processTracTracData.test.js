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
const normalizeObj = require('../normalization/normalizeTracTrac');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveTracTracData = require('../saveTracTracData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/tractrac.json');

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
  const raceID1 = jsonData.TracTracRace[0].id;
  const raceID2 = jsonData.TracTracRace[1].id;
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
    expect(events.size).toEqual(jsonData.TracTracEvent.length);
  });
  it('should get classes', async () => {
    const classes = await getClasses();
    expect(classes.size).toEqual(jsonData.TracTracClass.length);
  });
  it('should get races correctly', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(jsonData.TracTracRace.length);
  });
  it('should get routes correctly', async () => {
    const routes = await getRoutes([raceID1]);
    const expectedLength1 = jsonData.TracTracRoute.filter((r) => r.race === raceID1).length;
    expect(routes.size).toEqual(expectedLength1);

    const secondRoutes = await getRoutes([raceID1, raceID2]);
    const expectedLength2 = jsonData.TracTracRoute.filter((r) => r.race === raceID1 || r.race === raceID2).length;
    expect(secondRoutes.size).toEqual(expectedLength2);
  });
  it('should get race classes correctly', async () => {
    const result1 = await getRaceClasses([raceID1]);
    const expectedLength1 = jsonData.TracTracRaceClass.filter((r) => r.race === raceID1).length;
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(expectedLength1);

    const result2 = await getRaceClasses([raceID2]);
    const expectedLength2 = jsonData.TracTracRaceClass.filter((r) => r.race === raceID2).length;
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(expectedLength2);
  });
  it('should get race competitors correctly', async () => {
    const result1 = await getCompetitors([raceID1]);
    const expectedLength1 = jsonData.TracTracCompetitor.filter((r) => r.race === raceID1).length;
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(expectedLength1);

    const result2 = await getCompetitors([raceID2]);
    const expectedLength2 = jsonData.TracTracCompetitor.filter((r) => r.race === raceID2).length;
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(expectedLength2);
  });
  it('should get race competitor results correctly', async () => {
    const result1 = await getCompetitorResults([raceID1]);
    const expectedLength1 = jsonData.TracTracCompetitorResult.filter((r) => r.race === raceID1).length;
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(expectedLength1);

    const result2 = await getCompetitorResults([raceID2]);
    const expectedLength2 = jsonData.TracTracCompetitorResult.filter((r) => r.race === raceID2).length;
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(expectedLength2);
  });
  it('should get race competitor passings correctly', async () => {
    const result1 = await getCompetitorPassings([raceID1]);
    const expectedLength1 = jsonData.TracTracCompetitorPassing.filter((r) => r.race === raceID1).length;
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(expectedLength1);

    const result2 = await getCompetitorPassings([raceID2]);
    expect(result2.size).toEqual(0);
  });

  it('should get race controls correctly', async () => {
    const result1 = await getControls([raceID1]);
    const expectedLength1 = jsonData.TracTracControl.filter((r) => r.race === raceID1).length;
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(expectedLength1);

    const result2 = await getControls([raceID2]);
    const expectedLength2 = jsonData.TracTracControl.filter((r) => r.race === raceID2).length;
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(expectedLength2);
  });
  it('should get race control points correctly', async () => {
    const result1 = await getControlPoints([raceID1]);
    const expectedLength1 = jsonData.TracTracControlPoint.filter((r) => r.race === raceID1).length;
    expect(result1.size).toEqual(1);
    expect(result1.get(raceID1).length).toEqual(expectedLength1);

    const result2 = await getControlPoints([raceID2]);
    const expectedLength2 = jsonData.TracTracControlPoint.filter((r) => r.race === raceID2).length;
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(expectedLength2);
  });
  it('should get race control point positions correctly', async () => {
    const result1 = await getControlPointPositions([raceID1]);
    expect(result1.size).toEqual(0);

    const result2 = await getControlPointPositions([raceID2]);
    const expectedLength2 = jsonData.TracTracControlPointPosition.filter((r) => r.race === raceID2).length;
    expect(result2.size).toEqual(1);
    expect(result2.get(raceID2).length).toEqual(expectedLength2);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/tractrac/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/tractrac/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processTracTracData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
