module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|better-sqlite3)/)',
  ],
  // Exclude .history files and __snapshots__
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.history/'
  ],
  // Use specific resolver to handle better-sqlite3 mapping
  resolver: '<rootDir>/jest.resolver.js',
  // Make sure we mock all the necessary modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Each test file gets a fresh module cache
  resetModules: true,
};
