import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { FuelDistribution } from '../../types';
import { styles } from './MissionSettings.styles';

interface FuelDistributionSectionProps {
  fuelDistribution: FuelDistribution;
  onChange: (name: string, value: number) => void;
}

const FuelDistributionSection: React.FC<FuelDistributionSectionProps> = React.memo(({ 
  fuelDistribution, 
  onChange 
}) => {
  const handleFuelChange = useCallback((field: keyof FuelDistribution, value: number) => {
    onChange(`fuelDistribution.${field}`, value);
  }, [onChange]);

  return (
    <View style={styles.fuelDistribution}>
      <Text style={styles.subsectionTitle}>Fuel Distribution (lbs)</Text>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Outboard:</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20000}
            step={100}
            value={fuelDistribution.outbd}
            onValueChange={(value) => handleFuelChange('outbd', value)}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#007bff"
          />
          <Text style={styles.sliderValue}>{fuelDistribution.outbd}</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Inboard:</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20000}
            step={100}
            value={fuelDistribution.inbd}
            onValueChange={(value) => handleFuelChange('inbd', value)}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#007bff"
          />
          <Text style={styles.sliderValue}>{fuelDistribution.inbd}</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Auxiliary:</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20000}
            step={100}
            value={fuelDistribution.aux}
            onValueChange={(value) => handleFuelChange('aux', value)}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#007bff"
          />
          <Text style={styles.sliderValue}>{fuelDistribution.aux}</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>External:</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20000}
            step={100}
            value={fuelDistribution.ext}
            onValueChange={(value) => handleFuelChange('ext', value)}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#007bff"
          />
          <Text style={styles.sliderValue}>{fuelDistribution.ext}</Text>
        </View>
      </View>
    </View>
  );
});

FuelDistributionSection.displayName = 'FuelDistributionSection';

export default FuelDistributionSection; 