const db = require('../../models');
const {
  getRegattas,
  getEvents,
  getDivisions,
  getParticipants,
  getPositions,
  getRoutes,
  getStarts,
  getWaypoints,
  processRaceQsData,
} = require('../processRaceQsData');
const saveRaceQsData = require('../saveRaceQsData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/raceQs.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

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
  const event2 = 'random';
  beforeAll(async () => {
    await saveRaceQsData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.raceQsRegatta.destroy({
      truncate: true,
    });
    await db.raceQsEvent.destroy({
      truncate: true,
    });
    await db.raceQsDivision.destroy({
      truncate: true,
    });
    await db.raceQsParticipant.destroy({
      truncate: true,
    });
    await db.raceQsPosition.destroy({
      truncate: true,
    });
    await db.raceQsRoute.destroy({
      truncate: true,
    });
    await db.raceQsStart.destroy({
      truncate: true,
    });
    await db.raceQsWaypoint.destroy({
      truncate: true,
    });
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
  it('should get positions', async () => {
    const case1 = await getPositions([event1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(event1).length).toEqual(3);
    const case2 = await getPositions([event2]);
    expect(case2.size).toEqual(0);
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
    const case2 = await getPositions([event2]);
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
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/raceqs/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processRaceQsData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
