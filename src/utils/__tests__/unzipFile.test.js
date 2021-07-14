const { PassThrough } = require('stream');

const unzipFile = require('../unzipFile');

describe('Unzip a gzipped file from a read stream to a write stream', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });
  it('should reject when write error occured', async () => {
    const mockReadable = new PassThrough();
    const mockWriteable = new PassThrough();
    const mockError = new Error('Mocked Error Here!');

    const thePromise = unzipFile(mockReadable, mockWriteable);
    setTimeout(() => {
      mockWriteable.emit('error', mockError);
    }, 100);

    await expect(thePromise).rejects.toEqual(mockError);
  });

  it('should reject when file is not gzipped', async () => {
    const mockReadable = new PassThrough();
    const mockWriteable = new PassThrough();

    const thePromise = unzipFile(mockReadable, mockWriteable);
    setTimeout(() => {
      mockReadable.emit('data', 'plain string');
    }, 100);

    await expect(thePromise).rejects.toEqual(
      expect.objectContaining({ code: 'Z_DATA_ERROR' }),
    );
  });
});
