const db = require('../../models');
const { getDataPoints, processLiveData } = require('../processLiveData');
const { saveLiveDataPoint } = require('../../subscribers/dataPoint');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

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
        speed: 5,
        heading: 50,
        accuracy: 0,
        altitude: 0,
        at: 1624280155971,
        tws: 2,
        twa: 45,
        stw: 7,
        race_unit_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        boat_participant_group_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        boat_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        device_id: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
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
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processLiveData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});
