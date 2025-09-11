import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { MACGraph, AREAGraph } from './index';
import { validateMac } from '../../services/mac';

export type GraphsProps = {
  macPercent: number;
  weight: number;
  macGraphImgSrc: any; // Use ImageSourcePropType if you want
  areaGraphImgSrc: any; // New prop for the second graph image
  onBack: () => void;
};

export const Graphs = ({ macPercent, weight, macGraphImgSrc, areaGraphImgSrc, onBack: _onBack }: GraphsProps) => {
  const [isMacOutOfLimits, setIsMacOutOfLimits] = useState(false);
  const [macLimits, setMacLimits] = useState({ min: 0, max: 0 });

  useEffect(() => {
    const checkMacLimits = async () => {
      try {
        const validationResult = await validateMac(weight, macPercent);
        setIsMacOutOfLimits(!validationResult.isValid);
        setMacLimits({
          min: validationResult.minAllowedMac,
          max: validationResult.maxAllowedMac,
        });
      } catch (error) {
        console.error('Error validating MAC:', error);
        setIsMacOutOfLimits(false);
      }
    };

    checkMacLimits();
  }, [macPercent, weight]);

  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const resolved1 = RNImage.resolveAssetSource(macGraphImgSrc);
  const resolved2 = RNImage.resolveAssetSource(areaGraphImgSrc);
  const aspectRatio1 = resolved1.width / resolved1.height;
  const aspectRatio2 = resolved2.width / resolved2.height;
  // Divide available width between two graphs, with some margin
  const displayWidth = (screenWidth - 48) / 2; // 24px margin on each side
  const maxHeight = screenHeight * 0.8;
  const displayHeight1 = Math.min(displayWidth / aspectRatio1, maxHeight);
  const displayHeight2 = Math.min(displayWidth / aspectRatio2, maxHeight);

  return (
    <View style={styles.container}>
      {isMacOutOfLimits && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ MAC OUT OF LIMITS ({macLimits.min.toFixed(1)}% - {macLimits.max.toFixed(1)}%)
          </Text>
        </View>
      )}
      <View style={styles.graphsRow}>
        <View style={styles.graphWrapper}>
          <MACGraph
            macPercent={macPercent}
            weight={weight}
            imageSource={macGraphImgSrc}
            width={displayWidth}
            height={displayHeight1}
          />
        </View>
        <View style={styles.graphWrapper}>
          <AREAGraph
            imageSource={areaGraphImgSrc}
            width={displayWidth}
            height={displayHeight2}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#333',
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  graphsRow: {
    flexDirection: 'row',
    flex: 1,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  graphWrapper: {
    marginHorizontal: 8,
  },
});
