import React, { useCallback } from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './MissionSettings.styles';

interface BasicInfoSectionProps {
  name: string;
  date: string;
  departureLocation: string;
  arrivalLocation: string;
  onChange: (name: string, value: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = React.memo(({
  name,
  date,
  departureLocation,
  arrivalLocation,
  onChange,
}) => {
  const handleChange = useCallback((fieldName: string, value: string) => {
    onChange(fieldName, value);
  }, [onChange]);

  return (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Mission Name"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={(value) => handleChange('date', value)}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Route Information</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            value={departureLocation}
            onChangeText={(value) => handleChange('departureLocation', value)}
            placeholder="Departure"
            placeholderTextColor="#999"
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            value={arrivalLocation}
            onChangeText={(value) => handleChange('arrivalLocation', value)}
            placeholder="Arrival"
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';

export default BasicInfoSection;
