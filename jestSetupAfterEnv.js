jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({ Location: 'mockLocation' }),
    getObject: jest.fn().mockResolvedValue({ createReadStream: jest.fn() }),
  };
  return { S3: jest.fn(() => mockS3Instance) };
});

jest.setTimeout(60000);
afterAll(() => {
  jest.restoreAllMocks();
})
