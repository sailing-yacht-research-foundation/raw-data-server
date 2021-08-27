const path = require('path');
const temp = require('temp');
const db = require('../../../models');
const {
  getRaces,
  getObjectToRaceMapping,
  processAmericasCupData,
} = require('../../non-automatable/processAmericasCupData');
const saveAmericasCup2016Data = require('../../non-automatable/saveAmericasCup2016Data');
const uploadUtil = require('../../uploadUtil');
const expectedJson1 = require('../../../test-files/americasCup2016/objectsToSave_1.json');

jest.mock('../../normalization/non-automatable/normalizeAmericascup2016', () => ({
  normalizeRace: jest.fn().mockResolvedValue({ id: '123' }),
}));
jest.mock('../../../utils/unzipFile', () => ({
  downloadAndExtract: jest.fn().mockResolvedValue(true),
}));

describe('Processing non-existent AmericasCup2021 Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processAmericasCupData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist AmericasCup2021 Data from DB to Parquet', () => {
  let raceID;
  const americasCupKeys = Object.keys(db).filter((i) => i.indexOf('americasCup') === 0);
  beforeAll(async () => {
    await db.sequelize.sync();
    jest.spyOn(temp, 'mkdirSync').mockReturnValue(path.join(__dirname, '..', '..', '..', 'test-files', 'americasCup2016'));

    await saveAmericasCup2016Data('bucketName', 'fileName');
    raceID = expectedJson1.AmericasCupRace.original_id;
  });
  afterAll(async () => {
    for (key of americasCupKeys) {
      await db[key].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });

  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(1);
    expect(races[0].original_id).toEqual(
      expectedJson1.AmericasCupRace.original_id,
    );
  });
  it('should get compoundMarks tied to race', async () => {
    const compoundMarks = await getObjectToRaceMapping(
      'americasCupCompoundMark',
      [raceID],
    )
    const expectedLength = expectedJson1.AmericasCupCompoundMark.length;
    expect(compoundMarks.size).toEqual(1);
    const raceUID = Array.from(compoundMarks.keys())?.[0]
    expect(compoundMarks.get(raceUID)?.length).toEqual(expectedLength);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/americasCup/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/americasCup/position.parquet',
      avgWindUrl: 'https://awsbucket.com/thebucket/americasCup/avgwind.parquet',
      boatUrl: 'https://awsbucket.com/thebucket/americasCup/boat.parquet',
      boatShapeUrl: 'https://awsbucket.com/thebucket/americasCup/boatshape.parquet',
      regattaUrl: 'https://awsbucket.com/thebucket/americasCup/regatta.parquet',
    }
    const uploadSpy = jest
      .spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.avgWindUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.boatUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.boatShapeUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.regattaUrl);

    const fileUrl = await processAmericasCupData();
    expect(uploadSpy).toHaveBeenCalledTimes(6);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
