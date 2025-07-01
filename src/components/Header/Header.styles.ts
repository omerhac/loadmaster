import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 50 : 45,
    zIndex: 100,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  burgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  graphsButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#444',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphsButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
