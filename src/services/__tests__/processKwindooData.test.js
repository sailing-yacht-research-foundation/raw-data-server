const db = require('../../models');
const {
  getRegattaOwners,
  getRegattas,
  getRaces,
  getBoats,
  getComments,
  getHomeportLocations,
  getMarkers,
  getMIAs,
  getPOIs,
  getRunningGroups,
  getVideoStreams,
  getWaypoints,
  processKwindooData,
} = require('../processKwindooData');
const saveKwindooData = require('../saveKwindooData');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/kwindoo.json');

jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent Kwindoo Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any regattas', async () => {
    const regattas = await getRegattas();
    expect(regattas.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processKwindooData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Kwindoo Data from DB to Parquet', () => {
  const regatta1 = '89405c05-8967-49cf-a1a2-05e9d1b2973f';
  const regatta2 = '240c3fe1-ce41-482a-bd13-33b8a23edf15';
  beforeAll(async () => {
    await saveKwindooData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.kwindooRegattaOwner.destroy({ truncate: true });
    await db.kwindooRegatta.destroy({ truncate: true });
    await db.kwindooRace.destroy({ truncate: true });
    await db.kwindooBoat.destroy({ truncate: true });
    await db.kwindooComment.destroy({ truncate: true });
    await db.kwindooHomeportLocation.destroy({ truncate: true });
    await db.kwindooMarker.destroy({ truncate: true });
    await db.kwindooMIA.destroy({ truncate: true });
    await db.kwindooPOI.destroy({ truncate: true });
    await db.kwindooPosition.destroy({ truncate: true });
    await db.kwindooRunningGroup.destroy({ truncate: true });
    await db.kwindooVideoStream.destroy({ truncate: true });
    await db.kwindooWaypoint.destroy({ truncate: true });
    await db.kwindooFailedUrl.destroy({ truncate: true });
    await db.kwindooSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get regattas', async () => {
    const regattas = await getRegattas();
    expect(regattas.length).toEqual(3);
  });
  it('should get regatta owners', async () => {
    const owners = await getRegattaOwners();
    expect(owners.size).toEqual(3);
  });
  it('should get races', async () => {
    const case1 = await getRaces([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(2);
    const case2 = await getRaces([regatta2]);
    expect(case2.size).toEqual(1);
    expect(case2.get(regatta2).length).toEqual(1);
  });
  it('should get boats', async () => {
    const case1 = await getBoats([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getBoats([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get comments', async () => {
    const case1 = await getComments([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(2);
    const case2 = await getComments([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get homeport locations', async () => {
    const case1 = await getHomeportLocations([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getHomeportLocations([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get markers', async () => {
    const case1 = await getMarkers([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getMarkers([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get MIAs', async () => {
    const case1 = await getMIAs([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getMIAs([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get POIs', async () => {
    const case1 = await getPOIs([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getPOIs([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get running groups', async () => {
    const case1 = await getRunningGroups([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getRunningGroups([regatta2]);
    expect(case2.size).toEqual(1);
    expect(case2.get(regatta2).length).toEqual(1);
  });
  it('should get video streams', async () => {
    const case1 = await getVideoStreams([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(1);
    const case2 = await getVideoStreams([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should get waypoints', async () => {
    const case1 = await getWaypoints([regatta1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(2);
    const case2 = await getWaypoints([regatta2]);
    expect(case2.size).toEqual(0);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/kwindoo/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/kwindoo/position.parquet',
    };
    uploadFileToS3
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processKwindooData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
