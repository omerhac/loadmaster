import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';

type HeaderProps = {
  onSettingsClick: () => void;
  onPreviewClick: () => void;
};

const Header = ({ onSettingsClick, onPreviewClick }: HeaderProps) => {
  return (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />
      <Text style={styles.title}>LoadMaster</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={onPreviewClick}
        >
          <Text style={styles.buttonText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={onSettingsClick}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0066cc',
    paddingTop: Platform.OS === 'ios' ? 45 : 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default Header;
