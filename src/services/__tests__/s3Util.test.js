const AWS = require('aws-sdk');
const stream = require('stream');
const { uploadStreamToS3 } = require('../s3Util');

describe('s3Util.js', () => {
  let s3;
  beforeAll(() => {
    s3 = new AWS.S3();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
  describe('When uploadStreamToS3 is called', () => {
    it('should create a passthrough stream and promise', async () => {
      const mockResult = {
        Location: 'https://s3.aws.com/bucketName/path/to/file.txt',
        ETag: 'etag',
        Bucket: 'bucketName',
        Key: 'path/to/file.txt',
      };
      const mockPromise = new Promise((resolve, reject) => {
        // mock a response from s3 after done uploading
        setTimeout(() => {
          resolve(mockResult);
        }, 100);
      });

      s3.promise.mockResolvedValueOnce(mockPromise);
      const { writeStream, uploadPromise } = uploadStreamToS3(
        'path/to/file.txt',
        'bucketName',
      );
      expect(writeStream).toBeInstanceOf(stream.PassThrough);
      const result = await uploadPromise;
      expect(result).toEqual(mockResult);
    });
  });
});
