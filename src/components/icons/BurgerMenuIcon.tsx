import React from 'react';
import { View, StyleSheet } from 'react-native';

const BurgerMenuIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.line} />
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: 'white',
    marginVertical: 2,
    borderRadius: 1,
  },
});

export default BurgerMenuIcon;
