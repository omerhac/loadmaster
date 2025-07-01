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
  onNewMissionClick: () => void;
  onLoadMissionClick: () => void;
  onGraphsClick: () => void;
}

const Header = ({ onSettingsClick, onPreviewClick, onNewMissionClick, onLoadMissionClick, onGraphsClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      label: 'New Plan',
      icon: <NewIcon />,
      onClick: () => {
        setIsMenuOpen(false);
        onNewMissionClick();
      },
    },
    {
      label: 'Save Plan',
      icon: <SaveIcon />,
      onClick: () => console.log('Save Plan clicked'),
    },
    {
      label: 'Load Plan',
      icon: <LoadIcon />,
      onClick: () => {
        setIsMenuOpen(false);
        onLoadMissionClick();
      },
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
      <View style={styles.headerButtons}>

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
      <TouchableOpacity style={styles.graphsButton} onPress={onGraphsClick}>
        <Text style={styles.graphsButtonText}>Graphs</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
