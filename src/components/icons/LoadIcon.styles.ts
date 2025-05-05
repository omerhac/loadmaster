import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBody: {
    width: 2,
    height: 12,
    backgroundColor: '#333',
    position: 'absolute',
  },
  arrowHead: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#333',
    position: 'absolute',
    bottom: 2,
    transform: [{ rotate: '135deg' }],
  },
});
