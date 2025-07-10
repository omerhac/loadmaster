import React, { useCallback } from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { styles } from './MissionSettings.styles';
import FuelDistributionSection from './FuelDistributionSection';
import { FuelDistribution } from '../../types';

interface AircraftConfigSectionProps {
  aircraftIndex: string;
  crewMembersFront: number;
  crewMembersBack: number;
  cockpit: number;
  safetyGearWeight: number;
  fuelPods: boolean;
  fuelDistribution: FuelDistribution;
  onChange: (name: string, value: string | number | boolean) => void;
  others: number;
  othersFs: number;
}

const AircraftConfigSection = ({
  aircraftIndex,
  crewMembersFront,
  crewMembersBack,
  cockpit,
  safetyGearWeight,
  fuelPods,
  fuelDistribution,
  onChange,
  others,
  othersFs,
}: AircraftConfigSectionProps) => {
  const handleTextChange = useCallback((name: string, value: string) => {
    onChange(name, value);
  }, [onChange]);

  const handleNumericChange = useCallback((name: string, value: string) => {
    onChange(name, parseInt(value, 10) || 0);
  }, [onChange]);

  const handleSwitchChange = useCallback((name: string, value: boolean) => {
    onChange(name, value);
  }, [onChange]);

  return (
    <View style={styles.formGroup}>
      <Text style={styles.sectionTitle}>Aircraft Configuration</Text>
      <TextInput
        style={styles.input}
        value={aircraftIndex}
        onChangeText={(value) => handleTextChange('aircraftIndex', value)}
        placeholder="Aircraft Index"
        placeholderTextColor="#999"
      />

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Crew Front:</Text>
          <TextInput
            style={styles.numberInput}
            value={crewMembersFront.toString()}
            onChangeText={(value) => handleNumericChange('crewMembersFront', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Crew Back:</Text>
          <TextInput
            style={styles.numberInput}
            value={crewMembersBack.toString()}
            onChangeText={(value) => handleNumericChange('crewMembersBack', value)}
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
            value={cockpit.toString()}
            onChangeText={(value) => handleNumericChange('cockpit', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Safety Gear (lbs):</Text>
          <TextInput
            style={styles.numberInput}
            value={safetyGearWeight.toString()}
            onChangeText={(value) => handleNumericChange('safetyGearWeight', value)}
            keyboardType="numeric"
            placeholder="250"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Others:</Text>
          <TextInput
            style={styles.numberInput}
            keyboardType="numeric"
            value={(others ?? 0).toString()}
            onChangeText={text => onChange('others', Number(text))}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.labelSmall}>Others FS:</Text>
          <TextInput
            style={styles.numberInput}
            keyboardType="numeric"
            value={(othersFs ?? 0).toString()}
            onChangeText={text => onChange('othersFs', Number(text))}
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
