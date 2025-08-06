import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import FloatingMenu from '../FloatingMenu/FloatingMenu';
import {
  NewIcon,
  SaveIcon,
  LoadIcon,
  SettingsIcon,
  PreviewIcon,
  BurgerMenuIcon,
  GraphIcon,
  DeleteIcon,
} from '../icons';
import { styles } from './Header.styles';
import { validateMac } from '../../services/mac';
import { DatabaseFactory } from '../../services/db/DatabaseService';
import { MissionSettings } from '../../types';

interface HeaderProps {
  onSettingsClick: () => void;
  onPreviewClick: () => void;
  onNewMissionClick: () => void;
  onLoadMissionClick: () => void;
  onGraphsClick: () => void;
  macPercent?: number | null;
  totalWeight?: number | null;
  missionSettings?: MissionSettings | null;
}

const Header = ({ onSettingsClick, onPreviewClick, onNewMissionClick, onLoadMissionClick, onGraphsClick, macPercent, totalWeight, missionSettings }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMacOutOfLimits, setIsMacOutOfLimits] = useState(false);
  const blinkAnimation = useRef(new Animated.Value(1)).current;

  // Calculate fuel weight and ZFW like in Preview.tsx
  let totalFuelWeight = 0;
  let zeroFuelWeight = 0;

  if (missionSettings && missionSettings.fuelDistribution) {
    try {
      const fuel = missionSettings.fuelDistribution;
      totalFuelWeight = (fuel.outbd || 0) + (fuel.inbd || 0) + (fuel.aux || 0) +
                       (fuel.ext || 0) + (fuel.fuselage || 0);

      zeroFuelWeight = totalWeight !== null ? totalWeight - totalFuelWeight : 0;
    } catch (error) {
      console.warn('Header fuel calculations error:', error);
    }
  }

  const handleDeleteDatabase = () => {
    Alert.alert(
      'Delete Database',
      'Are you sure you want to delete the database? This action cannot be undone and will remove all missions, cargo items, and settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseFactory.deleteDatabase();
              Alert.alert('Success', 'Database deleted successfully. The app will restart with fresh data.');
            } catch (error) {
              console.error('Error deleting database:', error);
              Alert.alert('Error', 'Failed to delete database. Please try again.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const checkMacLimits = async () => {
      if (macPercent !== null && macPercent !== undefined && totalWeight !== null && totalWeight !== undefined) {
        try {
          const validationResult = await validateMac(totalWeight, macPercent);
          setIsMacOutOfLimits(!validationResult.isValid);
        } catch (error) {
          console.error('Error validating MAC:', error);
          setIsMacOutOfLimits(false);
        }
      } else {
        setIsMacOutOfLimits(false);
      }
    };

    checkMacLimits();
  }, [macPercent, totalWeight]);

  // Blinking animation
  useEffect(() => {
    if (isMacOutOfLimits) {
      const blinking = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(blinkAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      blinking.start();
      return () => blinking.stop();
    } else {
      blinkAnimation.setValue(1);
    }
  }, [isMacOutOfLimits, blinkAnimation]);

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
      disabled: true,
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
      disabled: true,
    },
    {
      label: 'Delete Database',
      icon: <DeleteIcon />,
      onClick: handleDeleteDatabase,
      style: {
        borderTopWidth: 1,
        borderTopColor: '#ff4444',
        borderTopStyle: 'dashed',
        marginTop: 5,
        paddingTop: 10,
      },
    },
  ];

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Loadmaster</Text>
      <View style={styles.metricsContainer}>
        {macPercent !== null && macPercent !== undefined && (
          <Animated.View
            style={[
              styles.metricContainer,
              styles.firstMetric,
              isMacOutOfLimits && {
                backgroundColor: blinkAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#ff0000', '#444'],
                }),
              },
            ]}
          >
            <Text style={[styles.metricLabel, isMacOutOfLimits && styles.alertLabel]}>MAC%</Text>
            <Text style={[styles.metricValue, isMacOutOfLimits && styles.alertValue]}>{macPercent.toFixed(1)}%</Text>
          </Animated.View>
        )}
        {totalWeight !== null && totalWeight !== undefined && (
          <View style={styles.metricContainer}>
            <Text style={styles.metricLabel}>TAKEOFF WEIGHT</Text>
            <Text style={styles.metricValue}>{totalWeight.toFixed(0)} lbs</Text>
          </View>
        )}
        {missionSettings && totalFuelWeight > 0 && (
          <View style={styles.metricContainer}>
            <Text style={styles.metricLabel}>FUEL WEIGHT</Text>
            <Text style={styles.metricValue}>{totalFuelWeight.toFixed(0)} lbs</Text>
          </View>
        )}
        {missionSettings && zeroFuelWeight > 0 && (
          <View style={styles.metricContainer}>
            <Text style={styles.metricLabel}>ZFW</Text>
            <Text style={styles.metricValue}>{zeroFuelWeight.toFixed(0)} lbs</Text>
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
