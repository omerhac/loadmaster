import React from 'react';
import { View } from 'react-native';
import { styles } from './NewIcon.styles';

const NewIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.horizontalLine} />
      <View style={styles.verticalLine} />
    </View>
  );
};

export default NewIcon;
