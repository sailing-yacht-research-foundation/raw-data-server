const AWS = require('aws-sdk');
const path = require('path');
const db = require('../../models');
const { uploadFileToS3, uploadGeoJsonToS3 } = require('../uploadFileToS3');
const geojsonData = require('../../test-files/bluewater.json');

jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return { S3: jest.fn(() => mockS3Instance) };
});

describe('Uploading files to S3', () => {
  let s3;
  beforeAll(() => {
    s3 = new AWS.S3();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
  it('should upload correctly', async () => {
    s3.promise.mockResolvedValueOnce({
      Location: 'jest-bucket-test.parquet',
    });
    const actual = await uploadFileToS3(
      path.resolve(__dirname, '../../test-files/test.parquet'),
      'online-bucket/test.parquet',
    );
    expect(actual).toEqual('jest-bucket-test.parquet');
  });

  it('should fail to upload', async () => {
    s3.promise.mockImplementation(() => {
      throw new Error();
    });
    const actual = await uploadFileToS3(
      path.resolve(__dirname, '../../test-files/test.parquet'),
      'online-bucket/test.parquet',
    );

    expect(actual).toEqual('');
  });
});

describe('Uploading geojson files to S3', () => {
  let s3;
  const raceId = 123;
  const source = 'BLUEWATER';

  beforeAll(async () => {
    s3 = new AWS.S3();
    await db.readyAboutTrackGeoJsonLookup.sync();
  });
  afterAll(async () => {
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should upload correctly', async () => {
    const uploadSpy = jest.spyOn(s3, 'upload');
    s3.promise.mockResolvedValueOnce({
      Location: 'jest-bucket-test.geojson',
    });
    const createLookup = jest.spyOn(db.readyAboutTrackGeoJsonLookup, 'create');
    const actual = await uploadGeoJsonToS3(raceId, geojsonData, source);
    expect(actual).toBe('jest-bucket-test.geojson');
    expect(createLookup).toHaveBeenCalledWith(
      expect.objectContaining({
        id: raceId,
        source: source,
        s3_id: expect.any(String),
      }),
      expect.anything(),
    );
    expect(uploadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: expect.anything(),
        Key: expect.stringMatching(/\.geojson$/),
        Body: geojsonData,
      }),
    );
  });
});
