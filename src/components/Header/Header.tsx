import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FloatingMenu from '../FloatingMenu/FloatingMenu';
import {
  NewIcon,
  SaveIcon,
  LoadIcon,
  SettingsIcon,
  PreviewIcon,
  BurgerMenuIcon,
} from '../icons';
import { styles } from './Header.styles';

interface HeaderProps {
  onSettingsClick: () => void;
  onPreviewClick: () => void;
}

const Header = ({ onSettingsClick, onPreviewClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      label: 'New Plan',
      icon: <NewIcon />,
      onClick: () => console.log('New Plan clicked'),
    },
    {
      label: 'Save Plan',
      icon: <SaveIcon />,
      onClick: () => console.log('Save Plan clicked'),
    },
    {
      label: 'Load Plan',
      icon: <LoadIcon />,
      onClick: () => console.log('Load Plan clicked'),
    },
    {
      label: 'Mission Settings',
      icon: <SettingsIcon />,
      onClick: onSettingsClick,
      style: {
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        borderTopStyle: 'dashed',
        marginTop: 5,
        paddingTop: 10,
      },
    },
    {
      label: 'Preview Mission',
      icon: <PreviewIcon />,
      onClick: onPreviewClick,
    },
  ];

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Loadmaster</Text>
      <TouchableOpacity
        style={styles.burgerButton}
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <BurgerMenuIcon />
        <FloatingMenu
          items={menuItems}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          position={{ top: 45, right: 0 }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
