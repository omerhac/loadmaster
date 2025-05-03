import React from 'react';
import { View } from 'react-native';
import { styles } from './SettingsIcon.styles';

const SettingsIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gear}>
        <View style={styles.gearCenter} />
      </View>
    </View>
  );
};

export default SettingsIcon;
