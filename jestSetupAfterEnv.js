require('./src/test-files/dbDALmocks');
jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({ Location: 'mockLocation' }),
    getObject: jest.fn().mockResolvedValue({ createReadStream: jest.fn() }),
  };
  return { S3: jest.fn(() => mockS3Instance) };
});
jest.mock('./src/utils/createMapScreenshot');
jest.mock('./src/utils/elasticsearch');
jest.mock('./src/utils/weatherSlicerUtil');
console.time = () => {}; // Disable console time since it generates too many logs
jest.setTimeout(15000);
afterAll(() => {
  jest.restoreAllMocks();
});
