import React from 'react';
import { View } from 'react-native';
import { styles } from './SaveIcon.styles';

const SaveIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.square} />
      <View style={styles.circle} />
    </View>
  );
};

export default SaveIcon;
