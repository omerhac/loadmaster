process.env.NODE_ENV = 'test';

/* global jest */

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/document/directory',
  exists: jest.fn().mockResolvedValue(true),
  copyFileAssets: jest.fn().mockResolvedValue(true),
  copyFile: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native', () => {
  // Create a platformSpecific store for tests to modify
  const platformMock = {
    OS: 'android',
  };

  return {
    Platform: platformMock,
    StyleSheet: {
      create: jest.fn(styles => styles),
    },
    useColorScheme: jest.fn(() => 'light'),
  };
});


// Announce setup completion
console.log('Jest test environment setup complete');
