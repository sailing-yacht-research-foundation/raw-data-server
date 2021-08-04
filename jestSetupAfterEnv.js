jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({ Location: 'mockLocation' }),
  };
  return { S3: jest.fn(() => mockS3Instance) };
});

jest.mock('elasticsearch', () => {
  const esInstance = {
    index: jest.fn().mockImplementation((_, callback) => callback(null, 'someData')),
    get: Promise.resolve({ found: true, _source: "found"}),
  };
  return { Client: jest.fn(() => esInstance) };
});

jest.setTimeout(60000);
afterAll(() => {
  jest.restoreAllMocks();
})
