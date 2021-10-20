const db = require('../../models');
const { getDataPoints, processLiveData } = require('../processLiveData');
const { saveLiveDataPoint } = require('../../subscribers/dataPoint');
const writeToParquet = require('../writeToParquet');
const uploadUtil = require('../uploadUtil');

jest.mock('../writeToParquet', () => jest.fn());

describe('Processing non-existent Live Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any data points', async () => {
    const dataPoints = await getDataPoints();
    expect(dataPoints.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processLiveData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Live Data from DB to Parquet', () => {
  beforeAll(async () => {
    await saveLiveDataPoint([
      {
        id: '74314800-9ccb-4f52-a37f-82e01b2afe81',
        location: { type: 'Point', coordinates: [39.807222, -76.984722] },
        sog: 5,
        cog: 50,
        twa: 0,
        set_drift: 0,
        elapsed_time: 10,
        timestamp: 1624280155971,
        competition_unit_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        vessel_participant_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        participant_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        user_id: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
        public_id:
          'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
      },
    ]);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.liveDataPoint.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get data points', async () => {
    const dataPoints = await getDataPoints();
    expect(dataPoints.length).toEqual(1);
    expect(dataPoints[0].id).toEqual('74314800-9ccb-4f52-a37f-82e01b2afe81');
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/livedata/result.parquet';
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processLiveData();
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
