import React from 'react';
import { View } from 'react-native';
import { styles } from './DeleteIcon.styles';

const DeleteIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.lid} />
      <View style={styles.bin} />
      <View style={styles.handle} />
    </View>
  );
};

export default DeleteIcon;
