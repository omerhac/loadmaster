import React from 'react';
import { View, StyleSheet } from 'react-native';

const SettingsIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gear}>
        <View style={styles.gearCenter} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default SettingsIcon;
