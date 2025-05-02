import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';

type HeaderProps = {
  onSettingsClick: () => void;
  onPreviewClick: () => void;
};

const Header = ({ onSettingsClick, onPreviewClick }: HeaderProps) => {
  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width } = Dimensions.get('window');

  return (
    <View style={[
      styles.header, 
      isIpad && styles.ipadHeader,
      isWindows && styles.windowsHeader,
      isTablet && styles.tabletHeader
    ]}>
      {Platform.OS !== 'windows' && (
        <StatusBar barStyle="light-content" backgroundColor="#0066cc" />
      )}
      <Text style={[
        styles.title, 
        isIpad && styles.ipadTitle,
        isWindows && styles.windowsTitle,
        isTablet && styles.tabletTitle
      ]}>LoadMaster</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.button, 
            isIpad && styles.ipadButton,
            isWindows && styles.windowsButton,
            isTablet && styles.tabletButton
          ]}
          onPress={onPreviewClick}
        >
          <Text style={[
            styles.buttonText, 
            isIpad && styles.ipadButtonText,
            isWindows && styles.windowsButtonText,
            isTablet && styles.tabletButtonText
          ]}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button, 
            isIpad && styles.ipadButton,
            isWindows && styles.windowsButton,
            isTablet && styles.tabletButton
          ]}
          onPress={onSettingsClick}
        >
          <Text style={[
            styles.buttonText, 
            isIpad && styles.ipadButtonText,
            isWindows && styles.windowsButtonText,
            isTablet && styles.tabletButtonText
          ]}>Settings</Text>
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
  ipadHeader: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 24,
  },
  windowsHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  tabletHeader: {
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  ipadTitle: {
    fontSize: 24,
  },
  windowsTitle: {
    fontSize: 22,
    fontFamily: Platform.OS === 'windows' ? 'Segoe UI' : undefined,
  },
  tabletTitle: {
    fontSize: 22,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  windowsButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginLeft: 10,
    borderRadius: 2,
  },
  tabletButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  ipadButtonText: {
    fontSize: 16,
  },
  windowsButtonText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'windows' ? 'Segoe UI' : undefined,
  },
  tabletButtonText: {
    fontSize: 15,
  },
});

export default Header;
