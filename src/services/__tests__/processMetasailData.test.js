const db = require('../../models');
const {
  getRaces,
  getEvents,
  getBoats,
  getBuoys,
  getGates,
  processMetasailData,
} = require('../processMetasailData');
const saveMetasailData = require('../saveMetasailData');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/metasail.json');

jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent Metasail Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any events', async () => {
    const events = await getEvents();
    expect(events.size).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processMetasailData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Metasail Data from DB to Parquet', () => {
  const race1 = '1c48bc9b-0933-4e85-ba46-f6ba9cd5b76d';
  const race2 = 'random';
  beforeAll(async () => {
    await saveMetasailData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.metasailEvent.destroy({ truncate: true });
    await db.metasailRace.destroy({ truncate: true });
    await db.metasailBoat.destroy({ truncate: true });
    await db.metasailBuoy.destroy({ truncate: true });
    await db.metasailGate.destroy({ truncate: true });
    await db.metasailPosition.destroy({ truncate: true });
    await db.metasailSuccessfulUrl.destroy({ truncate: true });
    await db.metasailFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get events', async () => {
    const events = await getEvents();
    expect(events.size).toEqual(1);
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(3);
  });
  it('should get boats', async () => {
    const case1 = await getBoats([race1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(race1).length).toEqual(2);
    const case2 = await getBoats([race2]);
    expect(case2.size).toEqual(0);
  });
  it('should get buoys', async () => {
    const case1 = await getBuoys([race1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(race1).length).toEqual(2);
    const case2 = await getBuoys([race2]);
    expect(case2.size).toEqual(0);
  });
  it('should get gates', async () => {
    const case1 = await getGates([race1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(race1).length).toEqual(3);
    const case2 = await getGates([race2]);
    expect(case2.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/metasail/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/metasail/position.parquet',
    };
    uploadFileToS3
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processMetasailData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
