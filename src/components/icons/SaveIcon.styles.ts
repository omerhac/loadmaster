import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  square: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 2,
  },
  circle: {
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    position: 'absolute',
  },
}); 