import React from 'react';
import { View } from 'react-native';
import { styles } from './BurgerMenuIcon.styles';

const BurgerMenuIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.line} />
      <View style={styles.line} />
    </View>
  );
};

export default BurgerMenuIcon;
