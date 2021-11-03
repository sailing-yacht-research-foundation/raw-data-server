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
jest.mock('./src/syrfDataServices/v1/googleAPI', () => {
  return {
    reverseGeoCode: jest.fn().mockReturnValue({
      countryCode: 'USA',
      countryName: 'United States of America',
      stateName: 'New York',
      cityName: 'New York',
    }),
  };
});

jest.setTimeout(60000);
afterAll(() => {
  jest.restoreAllMocks();
});
