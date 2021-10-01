const path = require('path');
const temp = require('temp');
const db = require('../../../models');
const {
  getRaces,
  getObjectToRaceMapping,
  processRegadata,
} = require('../../non-automatable/processRegadata');
const saveRegadata = require('../../non-automatable/saveRegadata/saveRegadata');
const uploadUtil = require('../../uploadUtil');
const expectedJson = require('../../../test-files/regadata/data/objectToSaved.json');
jest.mock('../../../utils/unzipFile', () => ({
  downloadAndExtractTar: jest.fn().mockResolvedValue(true),
}));
describe('Processing non-existent Regadata Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processRegadata();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Regadata Data from DB to Parquet', () => {
  const raceID = expectedJson.race.original_id;
  beforeAll(async () => {
    await db.sequelize.sync();

    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(
        path.join(__dirname, '..', '..', '..', 'test-files', 'regadata'),
      );

    await saveRegadata('bucketName', 'fileName');
  });
  afterAll(async () => {
    await db.regadataSail.destroy({ truncate: true });
    await db.regadataReport.destroy({ truncate: true });
    await db.regadataRace.destroy({ truncate: true });
    await db.sequelize.close();
    jest.restoreAllMocks();
  });

  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(1);
    expect(races[0].original_id).toEqual(expectedJson.race.original_id);
  });
  it('should get sails tied to race', async () => {
    const regadataSailMap = await getObjectToRaceMapping('regadataSail', [
      raceID,
    ]);
    expect(regadataSailMap.size).toEqual(1);
    const raceUID = Array.from(regadataSailMap.keys())?.[0];
    expect(regadataSailMap.get(raceUID)[0]?.race_original_id).toEqual(raceID);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/regadata/main.parquet',
      regadataReportUrl:
        'https://awsbucket.com/thebucket/regadata/report.parquet',
    };
    const uploadSpy = jest
      .spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.regadataReportUrl);

    const fileUrl = await processRegadata();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
