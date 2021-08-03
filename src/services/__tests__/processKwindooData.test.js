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
const normalizeObj = require('../normalization/normalizeKwindoo');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveKwindooData = require('../saveKwindooData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/kwindoo.json');

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
  const regatta1 = jsonData.KwindooRegatta[0].id;
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
    const expectedLength = jsonData.KwindooRegatta.length;
    expect(regattas.length).toEqual(expectedLength);
  });
  it('should get regatta owners', async () => {
    const owners = await getRegattaOwners();
    const expectedLength = jsonData.KwindooRegattaOwner.length;
    expect(owners.size).toEqual(expectedLength);
  });
  it('should get races', async () => {
    const case1 = await getRaces([regatta1]);
    const expectedLength = jsonData.KwindooRace.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get boats', async () => {
    const case1 = await getBoats([regatta1]);
    const expectedLength = jsonData.KwindooBoat.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get comments', async () => {
    const case1 = await getComments([regatta1]);
    const expectedLength = jsonData.KwindooComment.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get homeport locations', async () => {
    const case1 = await getHomeportLocations([regatta1]);
    const expectedLength = jsonData.KwindooHomeportLocation.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get markers', async () => {
    const case1 = await getMarkers([regatta1]);
    const expectedLength = jsonData.KwindooMarker.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get MIAs', async () => {
    const case1 = await getMIAs([regatta1]);
    const expectedLength = jsonData.KwindooMIA.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get POIs', async () => {
    const case1 = await getPOIs([regatta1]);
    const expectedLength = jsonData.KwindooPOI.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get running groups', async () => {
    const case1 = await getRunningGroups([regatta1]);
    const expectedLength = jsonData.KwindooRunningGroup.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get video streams', async () => {
    const case1 = await getVideoStreams([regatta1]);
    const expectedLength = jsonData.KwindooVideoStream.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should get waypoints', async () => {
    const case1 = await getWaypoints([regatta1]);
    const expectedLength = jsonData.KwindooWaypoint.filter((p) => p.regatta === regatta1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(regatta1).length).toEqual(expectedLength);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/kwindoo/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/kwindoo/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processKwindooData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
