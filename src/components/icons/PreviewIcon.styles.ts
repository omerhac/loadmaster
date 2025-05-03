import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eye: {
    width: 16,
    height: 8,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
  },
  pupil: {
    width: 4,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 4,
  },
});
