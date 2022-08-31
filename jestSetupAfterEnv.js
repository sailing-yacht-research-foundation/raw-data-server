jest.useFakeTimers();
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
jest.mock('./src/utils/elasticsearch');
jest.mock('./src/utils/weatherSlicerUtil');
jest.mock('./src/utils/world',
  () => {
    return {
      "world": {
        "features": []
      }
    }
  });

jest.mock('./src/externalServices/redis');
jest.mock('./src/jobs/openGraph');

jest.mock('./src/syrfDataServices/v1/googleAPI', () => {
  return {
    reverseGeoCode: jest.fn().mockResolvedValue({
      "countryName": '',
      "cityName": '',
    }),
  };
});
console.time = () => {}; // Disable console time since it generates too many logs
jest.setTimeout(15000);
afterAll(() => {
  jest.restoreAllMocks();
});
