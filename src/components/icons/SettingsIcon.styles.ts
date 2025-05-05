import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gear: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
  },
  gearCenter: {
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    position: 'absolute',
    top: 3,
    left: 3,
  },
});
