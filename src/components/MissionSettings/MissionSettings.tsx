import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MissionSettings, FuelDistribution, ManualCargoItem } from '../../types';
import { styles } from './MissionSettings.styles';
import BasicInfoSection from './BasicInfoSection';
import AircraftConfigSection from './AircraftConfigSection';
import ManualCargoInsertion from './ManualCargoInsertion';
import NotesSection from './NotesSection';

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

const MissionSettingsComponent: React.FC<MissionSettingsProps> = ({
  settings,
  onReturn,
  onSave,
}) => {
  const [formData, setFormData] = useState<MissionSettings>(() => settings ?? {
    id: generateId(),
    name: '',
    date: new Date().toISOString().split('T')[0],
    departureLocation: '',
    arrivalLocation: '',
    aircraftIndex: '',
    crewMembersFront: 0,
    crewMembersBack: 0,
    cockpit: 0,
    safetyGearWeight: 250,
    fuelPods: false,
    fuelDistribution: {
      outbd: 0,
      inbd: 0,
      aux: 0,
      ext: 0,
    },
    cargoItems: [],
    notes: '',
  });

  const handleChange = useCallback((name: string, value: string | number | boolean | ManualCargoItem[]) => {
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
  }, []);

  const handleSubmit = useCallback(() => {
    onSave(formData);
  }, [formData, onSave]);

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
        <BasicInfoSection
          name={formData.name}
          date={formData.date}
          departureLocation={formData.departureLocation}
          arrivalLocation={formData.arrivalLocation}
          onChange={handleChange}
        />

        <AircraftConfigSection
          aircraftIndex={formData.aircraftIndex}
          crewMembersFront={formData.crewMembersFront}
          crewMembersBack={formData.crewMembersBack}
          cockpit={formData.cockpit}
          safetyGearWeight={formData.safetyGearWeight}
          fuelPods={formData.fuelPods}
          fuelDistribution={formData.fuelDistribution}
          onChange={handleChange}
        />

        <ManualCargoInsertion
          cargoItems={formData.cargoItems}
          onChange={handleChange}
        />

        <NotesSection
          notes={formData.notes}
          onChange={handleChange}
        />
      </ScrollView>
    </View>
  );
};

export default React.memo(MissionSettingsComponent);
