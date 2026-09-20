export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 60000,
  setupFilesAfterEnv: ['./tests/setup.js'],
};
