import React, { useCallback } from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { styles } from './MissionSettings.styles';
import FuelDistributionSection from './FuelDistributionSection';
import { FuelDistribution } from '../../types';

interface AircraftConfigSectionProps {
  aircraftIndex: string;
  aircraftEmptyWeight: number;
  loadmasters: number;
  loadmastersFs: number;
  passengers: number;
  etc: number;
  etcFs: number;
  cockpit: number;
  safetyGearWeight: number;
  fuelPods: boolean;
  fuelDistribution: FuelDistribution;
  onChange: (name: string, value: string | number | boolean) => void;
}

const AircraftConfigSection = ({
  aircraftIndex,
  aircraftEmptyWeight,
  loadmasters,
  loadmastersFs,
  passengers,
  etc,
  etcFs,
  cockpit,
  safetyGearWeight,
  fuelPods,
  fuelDistribution,
  onChange,
}: AircraftConfigSectionProps) => {
  const handleNumericChange = useCallback((name: string, value: string) => {
    onChange(name, parseInt(value, 10) || 0);
  }, [onChange]);

  const handleFloatChange = useCallback((name: string, value: string) => {
    if (value === '') {
      onChange(name, '');
      return;
    }

    if (value === '.' || (value.endsWith('.') && value.split('.').length <= 2)) {
      onChange(name, value);
      return;
    }

    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      onChange(name, value);
    }
  }, [onChange]);

  const handleSwitchChange = useCallback((name: string, value: boolean) => {
    onChange(name, value);
  }, [onChange]);

  return (
    <View style={styles.formGroup}>
      <Text style={styles.sectionTitle}>Aircraft Configuration</Text>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Aircraft Index:</Text>
          <TextInput
            style={styles.numberInput}
            value={aircraftIndex}
            onChangeText={(value) => handleFloatChange('aircraftIndex', value)}
            keyboardType="decimal-pad"
            placeholder="Aircraft Index"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Empty Weight (lbs):</Text>
          <TextInput
            style={styles.numberInput}
            value={(aircraftEmptyWeight ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('aircraftEmptyWeight', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Loadmasters:</Text>
          <TextInput
            style={styles.numberInput}
            value={(loadmasters ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('loadmasters', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Loadmasters FS:</Text>
          <TextInput
            style={styles.numberInput}
            value={(loadmastersFs ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('loadmastersFs', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Cockpit:</Text>
          <TextInput
            style={styles.numberInput}
            value={(cockpit ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('cockpit', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Passengers:</Text>
          <TextInput
            style={styles.numberInput}
            value={(passengers ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('passengers', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Etc:</Text>
          <TextInput
            style={styles.numberInput}
            value={(etc ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('etc', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Etc FS:</Text>
          <TextInput
            style={styles.numberInput}
            value={(etcFs ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('etcFs', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Safety Gear (lbs):</Text>
          <TextInput
            style={styles.numberInput}
            value={(safetyGearWeight ?? 0).toString()}
            onChangeText={(value) => handleNumericChange('safetyGearWeight', value)}
            keyboardType="numeric"
            placeholder="250"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.switchContainer}>
          <Text style={styles.labelSmall}>Fuel Pods:</Text>
          <Switch
            value={fuelPods}
            onValueChange={(value) => handleSwitchChange('fuelPods', value)}
            trackColor={{ false: '#ddd', true: '#007bff' }}
            thumbColor={fuelPods ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <FuelDistributionSection
        fuelDistribution={fuelDistribution}
        onChange={onChange}
      />
    </View>
  );
};

AircraftConfigSection.displayName = 'AircraftConfigSection';

export default AircraftConfigSection;
