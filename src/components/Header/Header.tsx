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
  GraphIcon,
} from '../icons';
import { styles } from './Header.styles';

interface HeaderProps {
  onSettingsClick: () => void;
  onPreviewClick: () => void;
  onNewMissionClick: () => void;
  onLoadMissionClick: () => void;
  onGraphsClick: () => void;
  macPercent?: number | null;
  totalWeight?: number | null;
}

const Header = ({ onSettingsClick, onPreviewClick, onNewMissionClick, onLoadMissionClick, onGraphsClick, macPercent, totalWeight }: HeaderProps) => {
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
      <View style={styles.metricsContainer}>
        {macPercent !== null && macPercent !== undefined && (
          <View style={[styles.metricContainer, styles.firstMetric]}>
            <Text style={styles.metricLabel}>MAC%</Text>
            <Text style={styles.metricValue}>{macPercent.toFixed(1)}%</Text>
          </View>
        )}
        {totalWeight !== null && totalWeight !== undefined && (
          <View style={styles.metricContainer}>
            <Text style={styles.metricLabel}>GROSS WEIGHT</Text>
            <Text style={styles.metricValue}>{totalWeight.toFixed(0)} kg</Text>
          </View>
        )}
      </View>
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
        <GraphIcon />
      </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
