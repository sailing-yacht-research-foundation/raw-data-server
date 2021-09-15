const db = require('../../models');
const {
  getRegattas,
  getEvents,
  getDivisions,
  getParticipants,
  getRoutes,
  getStarts,
  getWaypoints,
  processRaceQsData,
} = require('../processRaceQsData');
const normalizeObj = require('../normalization/normalizeRaceQs');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveRaceQsData = require('../saveRaceQsData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/raceQs.json');

describe('Processing non-existent RaceQs Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any events', async () => {
    const events = await getEvents();
    expect(events.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processRaceQsData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist RaceQs Data from DB to Parquet', () => {
  const event1 = '846a774c-fefb-4729-b5bf-8746e2e64f4a';
  const event2 = 'b9770312-0bc5-11ec-9a03-0242ac130003';
  beforeAll(async () => {
    await saveRaceQsData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.raceQsRegatta.destroy({ truncate: true });
    await db.raceQsEvent.destroy({ truncate: true });
    await db.raceQsDivision.destroy({ truncate: true });
    await db.raceQsParticipant.destroy({ truncate: true });
    await db.raceQsPosition.destroy({ truncate: true });
    await db.raceQsRoute.destroy({ truncate: true });
    await db.raceQsStart.destroy({ truncate: true });
    await db.raceQsWaypoint.destroy({ truncate: true });
    await db.raceQsSuccessfulUrl.destroy({ truncate: true });
    await db.raceQsFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get events', async () => {
    const events = await getEvents();
    expect(events.length).toEqual(1);
  });
  it('should get regattas', async () => {
    const regattas = await getRegattas();
    expect(regattas.size).toEqual(1);
  });
  it('should get participants', async () => {
    const case1 = await getParticipants([event1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(event1).length).toEqual(5);
    const case2 = await getParticipants([event2]);
    expect(case2.size).toEqual(0);
  });
  it('should get divisions', async () => {
    const case1 = await getDivisions([event1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(event1).length).toEqual(1);
    const case2 = await getDivisions([event2]);
    expect(case2.size).toEqual(0);
  });
  it('should get routes', async () => {
    const case1 = await getRoutes([event1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(event1).length).toEqual(2);
    const case2 = await getRoutes([event2]);
    expect(case2.size).toEqual(0);
  });
  it('should get starts', async () => {
    const case1 = await getStarts([event1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(event1).length).toEqual(1);
    const case2 = await getStarts([event2]);
    expect(case2.size).toEqual(0);
  });
  it('should get waypoints', async () => {
    const case1 = await getWaypoints([event1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(event1).length).toEqual(2);
    const case2 = await getWaypoints([event2]);
    expect(case2.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/raceqs/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/raceqs/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processRaceQsData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
