process.env.NODE_ENV = 'test';

jest.mock('react-native', () => { // eslint-disable-line no-undef
  // Create a platformSpecific store for tests to modify
  const platformMock = {
    OS: 'android',
  };

  return {
    Platform: platformMock,
    StyleSheet: {
      create: jest.fn(styles => styles), // eslint-disable-line no-undef
    },
    useColorScheme: jest.fn(() => 'light'), // eslint-disable-line no-undef
  };
});


// Announce setup completion
console.log('Jest test environment setup complete');
