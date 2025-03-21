/** @type {import('jest').Config} */
const config = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
  ],
  // Explicitly exclude mock files and history files from test runs
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__mock__/',
    '/__mocks__/',
    '/.history/',
  ],
  // Use specific resolver to handle better-sqlite3 mapping
  resolver: '<rootDir>/jest.resolver.js',
  // Make sure we mock all the necessary modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Each test file gets a fresh module cache
  resetModules: true,
};

module.exports = config;
