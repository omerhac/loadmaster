import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { MissionSettings, FuelDistribution } from '../../types';
import Slider from '@react-native-community/slider';
import { styles } from './MissionSettings.styles';

// Helper function to generate a simple ID without relying on crypto
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

interface MissionSettingsProps {
  settings?: MissionSettings;
  onReturn: () => void;
  onSave: (settings: MissionSettings) => void;
}

const MissionSettingsComponent = ({ settings, onReturn, onSave }: MissionSettingsProps) => {
  const [formData, setFormData] = useState<MissionSettings>(() => settings ?? {
    id: generateId(),
    name: '',
    date: new Date().toISOString().split('T')[0],
    departureLocation: '',
    arrivalLocation: '',
    aircraftIndex: '',
    crewMembers: 0,
    cockpit: 0,
    safetyGearWeight: 250,
    fuelPods: false,
    fuelDistribution: {
      outbd: 0,
      inbd: 0,
      aux: 0,
      ext: 0,
    },
    notes: '',
  });

  const handleChange = (name: string, value: string | number | boolean) => {
    if (name.startsWith('fuelDistribution.')) {
      const fuelField = name.split('.')[1] as keyof FuelDistribution;
      setFormData(prev => ({
        ...prev,
        fuelDistribution: {
          ...prev.fuelDistribution,
          [fuelField]: typeof value === 'number' ? value : 0,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onReturn}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mission Settings</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSubmit}>
          <Text style={styles.headerButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Mission Name"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={formData.date}
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
              value={formData.departureLocation}
              onChangeText={(value) => handleChange('departureLocation', value)}
              placeholder="Departure"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              value={formData.arrivalLocation}
              onChangeText={(value) => handleChange('arrivalLocation', value)}
              placeholder="Arrival"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>Aircraft Configuration</Text>
          <TextInput
            style={styles.input}
            value={formData.aircraftIndex}
            onChangeText={(value) => handleChange('aircraftIndex', value)}
            placeholder="Aircraft Index"
            placeholderTextColor="#999"
          />

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.labelSmall}>Crew:</Text>
              <TextInput
                style={styles.numberInput}
                value={formData.crewMembers.toString()}
                onChangeText={(value) => handleChange('crewMembers', parseInt(value, 10) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelSmall}>Cockpit:</Text>
              <TextInput
                style={styles.numberInput}
                value={formData.cockpit.toString()}
                onChangeText={(value) => handleChange('cockpit', parseInt(value, 10) || 0)}
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
                value={formData.safetyGearWeight.toString()}
                onChangeText={(value) => handleChange('safetyGearWeight', parseInt(value, 10) || 0)}
                keyboardType="numeric"
                placeholder="250"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.labelSmall}>Fuel Pods:</Text>
              <Switch
                value={formData.fuelPods}
                onValueChange={(value) => handleChange('fuelPods', value)}
                trackColor={{ false: '#ddd', true: '#007bff' }}
                thumbColor={formData.fuelPods ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

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
                  value={formData.fuelDistribution.outbd}
                  onValueChange={(value) => handleChange('fuelDistribution.outbd', value)}
                  minimumTrackTintColor="#007bff"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#007bff"
                />
                <Text style={styles.sliderValue}>{formData.fuelDistribution.outbd}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Inboard:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={20000}
                  step={100}
                  value={formData.fuelDistribution.inbd}
                  onValueChange={(value) => handleChange('fuelDistribution.inbd', value)}
                  minimumTrackTintColor="#007bff"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#007bff"
                />
                <Text style={styles.sliderValue}>{formData.fuelDistribution.inbd}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Auxiliary:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={20000}
                  step={100}
                  value={formData.fuelDistribution.aux}
                  onValueChange={(value) => handleChange('fuelDistribution.aux', value)}
                  minimumTrackTintColor="#007bff"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#007bff"
                />
                <Text style={styles.sliderValue}>{formData.fuelDistribution.aux}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>External:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={20000}
                  step={100}
                  value={formData.fuelDistribution.ext}
                  onValueChange={(value) => handleChange('fuelDistribution.ext', value)}
                  minimumTrackTintColor="#007bff"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#007bff"
                />
                <Text style={styles.sliderValue}>{formData.fuelDistribution.ext}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.textArea}
            value={formData.notes || ''}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Mission Notes"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default MissionSettingsComponent;
