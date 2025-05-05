import React from 'react';
import { View } from 'react-native';
import { styles } from './LoadIcon.styles';

const LoadIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.arrowBody} />
      <View style={styles.arrowHead} />
    </View>
  );
};

export default LoadIcon;
