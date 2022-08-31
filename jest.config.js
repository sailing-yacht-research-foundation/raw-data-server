process.env.NODE_ENV = 'test';

module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    'node_modules',
    '<rootDir>/src/configs',
    '<rootDir>/src/models',
  ],
  modulePathIgnorePatterns: ['<rootDir>/src/syrf-schema/'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./jestSetupAfterEnv'],
};
