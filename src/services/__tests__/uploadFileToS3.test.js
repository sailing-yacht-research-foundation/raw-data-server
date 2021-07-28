const AWS = require('aws-sdk');
const path = require('path');
const db = require('../../models');
const {
  uploadFileToS3,
  uploadGeoJsonToS3,
  uploadDataToS3,
  deleteObjectInS3,
} = require('../uploadFileToS3');
const geojsonData = require('../../test-files/bluewater.json');

jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return { S3: jest.fn(() => mockS3Instance) };
});

describe('uploadFileToS3 test', () => {
  let s3;
  beforeAll(() => {
    s3 = new AWS.S3();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('Uploading file to S3', () => {
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

    it('should fail to upload when error is thrown', async () => {
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

  describe('Uploading geojson file to S3', () => {
    const raceId = 123;
    const source = 'BLUEWATER';

    beforeAll(async () => {
      await db.readyAboutTrackGeoJsonLookup.sync();
    });
    afterAll(async () => {
      await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
      await db.sequelize.close();
    });

    it('should upload correctly', async () => {
      const mockLocation = 'jest-bucket-test.geojson';
      const uploadSpy = jest.spyOn(s3, 'upload');
      s3.promise.mockResolvedValueOnce({
        Location: mockLocation,
      });
      const createLookup = jest.spyOn(
        db.readyAboutTrackGeoJsonLookup,
        'create',
      );
      const actual = await uploadGeoJsonToS3(raceId, geojsonData, source);
      expect(actual).toBe(mockLocation);
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

  describe('Uploading data to S3', () => {
    it('should upload correctly', async () => {
      const mockLocation = 'jest-bucket-test.kml';
      const mockResponse = {
        Location: mockLocation,
      };
      const uploadSpy = jest.spyOn(s3, 'upload');
      const params = {
        Bucket: 'BUCKET_NAME',
        Key: 'path/location/file',
        Body: { name: 'aaa', surname: 'bbb' },
      };
      s3.promise.mockResolvedValueOnce(mockResponse);
      const actual = await uploadDataToS3(params);
      expect(actual).toEqual(mockResponse);
      expect(uploadSpy).toHaveBeenCalledWith(expect.objectContaining(params));
    });
  });

  describe('Delete file to S3', () => {
    it('should upload correctly', async () => {
      const deleteSpy = jest.spyOn(s3, 'deleteObject');
      const params = {
        Bucket: 'BUCKET_NAME',
        Key: 'path/location/file',
      };
      s3.promise.mockResolvedValueOnce();
      await deleteObjectInS3(params);
      expect(deleteSpy).toHaveBeenCalledWith(expect.objectContaining(params));
    });
  });
});
