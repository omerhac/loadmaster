import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MissionSettings, FuelDistribution, CargoItem } from '../../types';
import { styles } from './MissionSettings.styles';
import BasicInfoSection from './BasicInfoSection';
import AircraftConfigSection from './AircraftConfigSection';
import ManualCargoInsertion from './ManualCargoInsertion';
import NotesSection from './NotesSection';


interface MissionSettingsProps {
  settings?: MissionSettings;
  onReturn: () => void;
  onSave: (settings: MissionSettings) => void;
  onAddToMainCargo?: (item: CargoItem, status?: 'inventory' | 'onStage' | 'onDeck') => void;
  onRemoveFromDeck?: (id: string) => void;
}

const MissionSettingsComponent: React.FC<MissionSettingsProps> = ({
  settings,
  onReturn,
  onSave,
  onAddToMainCargo,
  onRemoveFromDeck,
}) => {
  const [formData, setFormData] = useState<MissionSettings | null>(settings ?? null);

  const handleChange = useCallback((name: string, value: string | number | boolean | CargoItem[]) => {
    if (name.startsWith('fuelDistribution.')) {
      const fuelField = name.split('.')[1] as keyof FuelDistribution;
      setFormData(prev => ({
        ...prev!,
        fuelDistribution: {
          ...prev!.fuelDistribution,
          [fuelField]: typeof value === 'number' ? value : 0,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev!,
        [name]: value,
      }));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    onSave(formData!);
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
          name={formData!.name}
          date={formData!.date}
          departureLocation={formData!.departureLocation}
          arrivalLocation={formData!.arrivalLocation}
          onChange={handleChange}
        />

        <AircraftConfigSection
          aircraftIndex={formData!.aircraftIndex.toString()}
          crewMembersFront={formData!.crewMembersFront}
          crewMembersBack={formData!.crewMembersBack}
          cockpit={formData!.cockpit}
          safetyGearWeight={formData!.safetyGearWeight}
          fuelPods={formData!.fuelPods}
          fuelDistribution={formData!.fuelDistribution}
          onChange={handleChange}
        />

        <ManualCargoInsertion
          cargoItems={formData!.cargoItems}
          onChange={handleChange}
          onAddCargoItem={onAddToMainCargo}
          onRemoveItem={onRemoveFromDeck}
        />

        <NotesSection
          notes={formData!.notes}
          onChange={handleChange}
        />
      </ScrollView>
    </View>
  );
};

export default React.memo(MissionSettingsComponent);
