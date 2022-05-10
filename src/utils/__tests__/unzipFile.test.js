const { PassThrough } = require('stream');
const extract = require('extract-zip');
const fs = require('fs');
const AWS = require('aws-sdk');

const { gunzipFile, downloadAndExtract } = require('../unzipFile');

jest.mock('extract-zip');

describe('Unzip a gzipped file from a read stream to a write stream', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should reject when write error occured', async () => {
    const mockReadable = new PassThrough();
    const mockWriteable = new PassThrough();
    const mockError = new Error('Mocked Error Here!');

    const thePromise = gunzipFile(mockReadable, mockWriteable);
    mockWriteable.emit('error', mockError);

    await expect(thePromise).rejects.toEqual(mockError);
  });

  it('should reject when file is not gzipped', async () => {
    const mockReadable = new PassThrough();
    const mockWriteable = new PassThrough();

    const thePromise = gunzipFile(mockReadable, mockWriteable);
    mockReadable.emit('data', 'plain string');

    await expect(thePromise).rejects.toEqual(
      expect.objectContaining({ code: 'Z_DATA_ERROR' }),
    );
  });

  describe('When downloadAndExtract is called', () => {
    it('should call s3 getObject and extract with the passed directory path', async () => {
      const mockReadable = new PassThrough();
      const mockWriteable = new PassThrough();
      const s3 = new AWS.S3();
      s3.getObject.mockResolvedValue({
        createReadStream: jest.fn().mockReturnValue(mockReadable),
      });
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteable);

      const targetDir = 'directoryToExtraction';
      setTimeout(() => {
        mockReadable.emit('data', 'plain string');
        mockReadable.emit('end', 'message end');
      }, 100);
      await downloadAndExtract({
        s3,
        bucketName: 'bucketName',
        fileName: 'fileName',
        targetDir,
      });

      expect(s3.getObject).toHaveBeenCalledTimes(1);
      expect(extract).toHaveBeenCalledWith(expect.any(String), {
        dir: targetDir,
      });
    });
  });
});
