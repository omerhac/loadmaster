// Set environment to test explicitly
process.env.NODE_ENV = 'test';


// Setup for __tests__/services/DatabaseService.test.ts tests
// Legacy mocks for the old style tests that expect these functions to be available
jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      executeSql: jest.fn().mockImplementation(() => Promise.resolve([{
        rows: {
          length: 0,
          item: jest.fn()
        }
      }]))
    });
  })
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/document/directory',
  exists: jest.fn().mockResolvedValue(true),
  copyFileAssets: jest.fn().mockResolvedValue(true),
  copyFile: jest.fn().mockResolvedValue(true)
}));

jest.mock('react-native', () => {
  // Create a platformSpecific store for tests to modify
  const platformMock = {
    OS: 'android'
  };

  return {
    Platform: platformMock,
    StyleSheet: {
      create: jest.fn(styles => styles)
    },
    useColorScheme: jest.fn(() => 'light')
  };
});

// Don't mock App globally - it will be mocked in individual test files

// Setup mock for fetch
global.fetch = require('jest-fetch-mock');

// Silence console errors in tests
console.error = jest.fn();

// Announce setup completion
console.log('Jest test environment setup complete'); 