import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FuelDistribution } from '../../types';
import { styles } from './MissionSettings.styles';
import PlatformSlider from '../shared/PlatformSlider';

interface FuelDistributionSectionProps {
  fuelDistribution: FuelDistribution;
  onChange: (name: string, value: number) => void;
}

const FuelDistributionSection: React.FC<FuelDistributionSectionProps> = React.memo(({
  fuelDistribution,
  onChange,
}) => {
  const handleFuelChange = useCallback((field: keyof FuelDistribution, value: number) => {
    onChange(`fuelDistribution.${field}`, value);
  }, [onChange]);

  return (
    <View style={styles.fuelDistribution}>
      <Text style={styles.subsectionTitle}>Fuel Distribution (lbs)</Text>

      <View style={styles.modernSliderContainer}>
        <PlatformSlider
          label="Outboard"
          minimumValue={0}
          maximumValue={20000}
          step={100}
          value={fuelDistribution.outbd}
          onValueChange={(value) => handleFuelChange('outbd', value)}
          minimumTrackTintColor="#0066cc"
          maximumTrackTintColor="#e8e8e8"
          thumbTintColor="#0066cc"
          showValue={true}
          allowManualInput={true}
        />

        <PlatformSlider
          label="Inboard"
          minimumValue={0}
          maximumValue={20000}
          step={100}
          value={fuelDistribution.inbd}
          onValueChange={(value) => handleFuelChange('inbd', value)}
          minimumTrackTintColor="#0066cc"
          maximumTrackTintColor="#e8e8e8"
          thumbTintColor="#0066cc"
          showValue={true}
          allowManualInput={true}
        />

        <PlatformSlider
          label="Auxiliary"
          minimumValue={0}
          maximumValue={20000}
          step={100}
          value={fuelDistribution.aux}
          onValueChange={(value) => handleFuelChange('aux', value)}
          minimumTrackTintColor="#0066cc"
          maximumTrackTintColor="#e8e8e8"
          thumbTintColor="#0066cc"
          showValue={true}
          allowManualInput={true}
        />

        <PlatformSlider
          label="External"
          minimumValue={0}
          maximumValue={20000}
          step={100}
          value={fuelDistribution.ext}
          onValueChange={(value) => handleFuelChange('ext', value)}
          minimumTrackTintColor="#0066cc"
          maximumTrackTintColor="#e8e8e8"
          thumbTintColor="#0066cc"
          showValue={true}
          allowManualInput={true}
        />

        <PlatformSlider
          label="Fuselage"
          minimumValue={0}
          maximumValue={20000}
          step={100}
          value={fuelDistribution.fuselage}
          onValueChange={(value) => handleFuelChange('fuselage', value)}
          minimumTrackTintColor="#0066cc"
          maximumTrackTintColor="#e8e8e8"
          thumbTintColor="#0066cc"
          showValue={true}
          allowManualInput={true}
        />
      </View>
    </View>
  );
});

FuelDistributionSection.displayName = 'FuelDistributionSection';

export default FuelDistributionSection;
