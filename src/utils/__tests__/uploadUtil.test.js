const AWS = require('aws-sdk');
const path = require('path');
const {
  uploadFileToS3,
  uploadDataToS3,
  deleteObjectInS3,
} = require('../uploadUtil');

describe('uploadFileToS3 test', () => {
  let s3;
  beforeAll(() => {
    s3 = new AWS.S3();
  });
  afterEach(() => {
    jest.restoreAllMocks();
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
