const AWS = require('aws-sdk');
const uploadFileToS3 = require('../uploadFileToS3');

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
      'tmp/test.parquet',
      'online-bucket/test.parquet',
    );
    expect(actual).toEqual('jest-bucket-test.parquet');
  });

  it('should fail to upload', async () => {
    s3.promise.mockImplementation(() => {
      throw new Error();
    });
    const actual = await uploadFileToS3(
      'tmp/test.parquet',
      'online-bucket/test.parquet',
    );
    expect(actual).toEqual('');
  });
});
