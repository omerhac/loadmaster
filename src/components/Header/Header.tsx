import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
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
import { validateMac } from '../../services/mac';

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
  const [isMacOutOfLimits, setIsMacOutOfLimits] = useState(false);
  const blinkAnimation = useRef(new Animated.Value(1)).current;

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
            <Text style={styles.metricLabel}>GROSS WEIGHT</Text>
            <Text style={styles.metricValue}>{totalWeight.toFixed(0)} lbs</Text>
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
