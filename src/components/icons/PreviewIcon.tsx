import React from 'react';
import { View } from 'react-native';
import { styles } from './PreviewIcon.styles';

const PreviewIcon = () => {
  return (
    <View style={styles.container}>
      <View style={styles.eye}>
        <View style={styles.pupil} />
      </View>
    </View>
  );
};

export default PreviewIcon;
