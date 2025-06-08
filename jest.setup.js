process.env.NODE_ENV = 'test';

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
