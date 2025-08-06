import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1002,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 200,
    padding: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 0,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  menuItemTextDisabled: {
    color: '#999',
  },
  disabledIcon: {
    opacity: 0.5,
  },
});
