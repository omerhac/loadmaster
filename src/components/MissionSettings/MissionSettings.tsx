import React, { useState, useCallback, useEffect } from 'react';
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
import {
  DEFAULT_SAFETY_GEAR_WEIGHT,
  DEFAULT_FOOD_WEIGHT,
  DEFAULT_ETC_WEIGHT,
  DEFAULT_OUTBOARD_FUEL,
  DEFAULT_INBOARD_FUEL,
  DEFAULT_FUSELAGE_FUEL,
  DEFAULT_AUXILIARY_FUEL,
  DEFAULT_EXTERNAL_FUEL,
  DEFAULT_AIRCRAFT_ID,
  DEFAULT_LOADMASTER_WEIGHT,
  DEFAULT_CREW_GEAR_WEIGHT,
} from '../../constants';

const DEFAULT_MISSION_SETTINGS: MissionSettings = {
  id: '1',
  name: 'New Mission',
  date: new Date().toISOString().split('T')[0],
  departureLocation: 'Nevatim',
  arrivalLocation: 'Ramat David',
  aircraftIndex: 0,
  aircraftEmptyWeight: 83288,
  loadmasters: 6,
  loadmastersFs: DEFAULT_LOADMASTER_WEIGHT,
  passengers: 0,
  etc: 0,
  etcFs: 0,
  cockpit: 0,
  safetyGearWeight: DEFAULT_SAFETY_GEAR_WEIGHT,
  foodWeight: DEFAULT_FOOD_WEIGHT,
  crewGearWeight: DEFAULT_CREW_GEAR_WEIGHT,
  etcWeight: DEFAULT_ETC_WEIGHT,
  configurationWeights: 0,
  fuelPods: false,
  fuelDistribution: {
    outbd: DEFAULT_OUTBOARD_FUEL,
    inbd: DEFAULT_INBOARD_FUEL,
    aux: DEFAULT_AUXILIARY_FUEL,
    ext: DEFAULT_EXTERNAL_FUEL,
    fuselage: DEFAULT_FUSELAGE_FUEL,
  },
  aircraftId: DEFAULT_AIRCRAFT_ID,
  notes: '',
};

interface MissionSettingsProps {
  settings?: MissionSettings;
  cargoItems: CargoItem[];
  onReturn: () => void;
  onSave: (settings: MissionSettings) => void;
  onAddToMainCargo?: (item: CargoItem, status?: 'inventory' | 'onStage' | 'onDeck') => void;
  onRemoveFromDeck?: (id: string) => void;
}

const MissionSettingsComponent: React.FC<MissionSettingsProps> = ({
  settings,
  cargoItems,
  onReturn,
  onSave,
  onAddToMainCargo,
  onRemoveFromDeck,
}) => {
  const [formData, setFormData] = useState<MissionSettings>(settings || DEFAULT_MISSION_SETTINGS);

  useEffect(() => {
    if (settings) {
      const mergedData = {
        ...DEFAULT_MISSION_SETTINGS,
        ...settings,
        fuelDistribution: {
          ...DEFAULT_MISSION_SETTINGS.fuelDistribution,
          ...settings.fuelDistribution,
        },
      };
      setFormData(() => mergedData);
    }
  }, [settings]);

  const handleChange = useCallback((name: string, value: string | number | boolean) => {
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
          aircraftIndex={formData.aircraftIndex.toString()}
          aircraftEmptyWeight={formData.aircraftEmptyWeight}
          loadmasters={formData.loadmasters}
          loadmastersFs={formData.loadmastersFs}
          passengers={formData.passengers}
          etc={formData.etc}
          etcFs={formData.etcFs}
          cockpit={formData.cockpit}
          safetyGearWeight={formData.safetyGearWeight}
          fuelPods={formData.fuelPods}
          fuelDistribution={formData.fuelDistribution}
          onChange={handleChange}
        />

        <ManualCargoInsertion
          cargoItems={cargoItems}
          onAddCargoItem={onAddToMainCargo}
          onRemoveItem={onRemoveFromDeck}
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
