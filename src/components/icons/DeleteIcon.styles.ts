import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bin: {
    width: 10,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#ff4444',
    borderRadius: 1,
    borderTopWidth: 0,
  },
  lid: {
    width: 12,
    height: 2,
    backgroundColor: '#ff4444',
    borderRadius: 1,
    position: 'absolute',
    top: 2,
  },
  handle: {
    width: 4,
    height: 2,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 1,
    position: 'absolute',
    top: 1,
    backgroundColor: 'transparent',
  },
});
