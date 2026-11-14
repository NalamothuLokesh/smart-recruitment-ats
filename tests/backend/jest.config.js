const path = require('path');

module.exports = {
  testEnvironment: 'node',
  rootDir: path.resolve(__dirname, '../../'),
  testMatch: ['<rootDir>/tests/backend/**/*.test.js'],
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../../backend/node_modules')],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};


