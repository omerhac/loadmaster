import Orientation from 'react-native-orientation-locker';

export const lockToLandscape = () => {
  // Force landscape orientation
  Orientation.lockToLandscape();
};

export const releaseOrientation = () => {
  // Release the orientation lock
  Orientation.unlockAllOrientations();
}; 