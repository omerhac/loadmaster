import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import FloatingMenu from '../FloatingMenu/FloatingMenu';

type HeaderProps = {
  onSettingsClick: () => void;
  onPreviewClick: () => void;
};

const Header = ({ onSettingsClick, onPreviewClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      label: 'New Plan',
      onClick: () => console.log('New Plan clicked'),
    },
    {
      label: 'Save Plan',
      onClick: () => console.log('Save Plan clicked'),
    },
    {
      label: 'Load Plan',
      onClick: () => console.log('Load Plan clicked'),
    },
    {
      label: 'Mission Settings',
      onClick: onSettingsClick,
      style: { borderTopWidth: 1, borderTopColor: '#ddd', marginTop: 5, paddingTop: 10 },
    },
    {
      label: 'Preview Mission',
      onClick: onPreviewClick,
    },
  ];

  return (
    <View style={styles.header}>
      {Platform.OS !== 'windows' && (
        <StatusBar barStyle="light-content" backgroundColor="#0066cc" />
      )}
      <Text style={styles.title}>Loadmaster</Text>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsMenuOpen(!isMenuOpen)}
        >
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
        </TouchableOpacity>

        {isMenuOpen && (
          <FloatingMenu
            items={menuItems}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            position={{ top: 40, right: 0 }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0066cc',
    paddingTop: Platform.OS === 'ios' ? 10 : 5,
    paddingBottom: 5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 50 : 45,
    zIndex: 1000,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    width: 28,
    height: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
  },
  burgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
});

export default Header;
