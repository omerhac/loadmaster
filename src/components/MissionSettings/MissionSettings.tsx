import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { MissionSettings, FuelDistribution, CargoItem } from '../../types';
import { styles } from './MissionSettings.styles';
import LocationDropdown from './LocationDropdown';
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
  DEFAULT_CARGO_TYPE_ID,
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
  onUpdateItem?: (item: CargoItem) => void;
}

const MissionSettingsComponent: React.FC<MissionSettingsProps> = ({
  settings,
  cargoItems,
  onReturn: _onReturn,
  onSave,
  onAddToMainCargo,
  onRemoveFromDeck,
  onUpdateItem,
}) => {
  const [formData, setFormData] = useState<MissionSettings>(settings || DEFAULT_MISSION_SETTINGS);
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // New cargo form state
  const [newCargoName, setNewCargoName] = useState('');
  const [newCargoWeight, setNewCargoWeight] = useState('');
  const [newCargoFs, setNewCargoFs] = useState('');

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

  useEffect(() => {
    if (formData.date) {
      const dateObj = new Date(formData.date);
      if (!isNaN(dateObj.getTime())) {
        setDay(dateObj.getDate());
        setMonth(dateObj.getMonth() + 1);
        setYear(dateObj.getFullYear());
      }
    }
  }, [formData.date]);

  const handleChange = useCallback((name: string, value: string | number | boolean) => {
    if (name.startsWith('fuelDistribution.')) {
      const fuelField = name.split('.')[1] as keyof FuelDistribution;
      setFormData(prev => ({
        ...prev,
        fuelDistribution: {
          ...prev.fuelDistribution,
          [fuelField]: typeof value === 'number' ? value : parseInt(String(value), 10) || 0,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, []);

  const handleNumericChange = useCallback((name: string, value: string) => {
    handleChange(name, parseInt(value, 10) || 0);
  }, [handleChange]);

  const updateDate = useCallback((newDay: number, newMonth: number, newYear: number) => {
    const formattedDate = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    handleChange('date', formattedDate);
  }, [handleChange]);

  const handleDayChange = useCallback((delta: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let newDay = day + delta;
    if (newDay > daysInMonth) {newDay = 1;}
    if (newDay < 1) {newDay = daysInMonth;}
    setDay(newDay);
    updateDate(newDay, month, year);
  }, [day, month, year, updateDate]);

  const handleMonthChange = useCallback((delta: number) => {
    let newMonth = month + delta;
    if (newMonth > 12) {newMonth = 1;}
    if (newMonth < 1) {newMonth = 12;}
    setMonth(newMonth);
    const daysInNewMonth = new Date(year, newMonth, 0).getDate();
    const adjustedDay = day > daysInNewMonth ? daysInNewMonth : day;
    if (adjustedDay !== day) {setDay(adjustedDay);}
    updateDate(adjustedDay, newMonth, year);
  }, [day, month, year, updateDate]);

  const handleYearChange = useCallback((delta: number) => {
    const newYear = year + delta;
    setYear(newYear);
    updateDate(day, month, newYear);
  }, [day, month, year, updateDate]);

  const handleSubmit = useCallback(() => {
    const dataToSave = {
      ...formData,
      aircraftIndex: typeof formData.aircraftIndex === 'string'
        ? parseFloat(formData.aircraftIndex) || 0
        : formData.aircraftIndex,
    };
    onSave(dataToSave);
  }, [formData, onSave]);

  const handleAddCargo = useCallback(() => {
    if (!onAddToMainCargo) {
      console.warn('onAddToMainCargo not provided');
      return;
    }
    
    const parsedFs = parseInt(newCargoFs, 10) || 0;
    const parsedWeight = parseInt(newCargoWeight, 10) || 0;
    const cargoName = newCargoName.trim() || `Cargo ${Date.now()}`;

    const newItem: CargoItem = {
      id: `cargo-${Date.now()}`,
      cargo_type_id: DEFAULT_CARGO_TYPE_ID,
      name: cargoName,
      weight: parsedWeight,
      length: 50,
      width: 50,
      height: 50,
      cog: 25,
      fs: parsedFs,
      status: 'onDeck',
      position: { x: 0, y: 0 },
      dock: 'CG',
    };
    
    console.log('Adding cargo item:', newItem);
    onAddToMainCargo(newItem, 'onDeck');
    
    // Reset form
    setNewCargoName('');
    setNewCargoWeight('');
    setNewCargoFs('');
  }, [onAddToMainCargo, newCargoName, newCargoWeight, newCargoFs]);

  const totalFuel = (formData.fuelDistribution.outbd || 0) +
                   (formData.fuelDistribution.inbd || 0) +
                   (formData.fuelDistribution.aux || 0) +
                   (formData.fuelDistribution.ext || 0) +
                   (formData.fuelDistribution.fuselage || 0);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const onDeckItems = cargoItems.filter(item => item.status === 'onDeck');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Two Column Layout */}
        <View style={styles.twoColumnRow}>
          {/* Left Column */}
          <View style={styles.column}>
            {/* Basic Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mission Info</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.formRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.label}>Mission Name</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(value) => handleChange('name', value)}
                      placeholder="Mission Name"
                    />
                  </View>
                </View>
                <View style={styles.formRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.label}>Date</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <View style={styles.dateRow}>
                      <View style={styles.dateGroup}>
                        <TouchableOpacity style={styles.arrowButton} onPress={() => handleDayChange(-1)}>
                          <Text style={styles.arrowText}>◀</Text>
                        </TouchableOpacity>
                        <Text style={styles.dateValue}>{day}</Text>
                        <TouchableOpacity style={styles.arrowButton} onPress={() => handleDayChange(1)}>
                          <Text style={styles.arrowText}>▶</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.dateSeparator}>/</Text>
                      <View style={styles.dateGroup}>
                        <TouchableOpacity style={styles.arrowButton} onPress={() => handleMonthChange(-1)}>
                          <Text style={styles.arrowText}>◀</Text>
                        </TouchableOpacity>
                        <Text style={styles.dateValue}>{monthNames[month - 1]}</Text>
                        <TouchableOpacity style={styles.arrowButton} onPress={() => handleMonthChange(1)}>
                          <Text style={styles.arrowText}>▶</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.dateSeparator}>/</Text>
                      <View style={styles.dateGroup}>
                        <TouchableOpacity style={styles.arrowButton} onPress={() => handleYearChange(-1)}>
                          <Text style={styles.arrowText}>◀</Text>
                        </TouchableOpacity>
                        <Text style={styles.dateValue}>{year}</Text>
                        <TouchableOpacity style={styles.arrowButton} onPress={() => handleYearChange(1)}>
                          <Text style={styles.arrowText}>▶</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.formRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.label}>Departure</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <LocationDropdown
                      value={formData.departureLocation}
                      onSelect={(value) => handleChange('departureLocation', value)}
                      placeholder="Select"
                    />
                  </View>
                </View>
                <View style={styles.formRowNoBorder}>
                  <View style={styles.labelCell}>
                    <Text style={styles.label}>Arrival</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <LocationDropdown
                      value={formData.arrivalLocation}
                      onSelect={(value) => handleChange('arrivalLocation', value)}
                      placeholder="Select"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Aircraft Config */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Aircraft Configuration</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.inlineRow}>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Empty Weight</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.aircraftEmptyWeight ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('aircraftEmptyWeight', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Aircraft Index</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={formData.aircraftIndex.toString()}
                      onChangeText={(value) => handleChange('aircraftIndex', value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <View style={styles.inlineRow}>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Loadmasters</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.loadmasters ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('loadmasters', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Loadmasters FS</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.loadmastersFs ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('loadmastersFs', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.inlineRow}>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Cockpit</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.cockpit ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('cockpit', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Passengers</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.passengers ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('passengers', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.inlineRow}>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Safety Gear (lbs)</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.safetyGearWeight ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('safetyGearWeight', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inlineGroup}>
                    <Text style={styles.labelSmall}>Config Weight</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.configurationWeights ?? 0).toString()}
                      onChangeText={(value) => handleNumericChange('configurationWeights', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Fuel Pods</Text>
                  <Switch
                    value={formData.fuelPods}
                    onValueChange={(value) => handleChange('fuelPods', value)}
                    trackColor={{ false: '#ddd', true: '#007bff' }}
                  />
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <View style={styles.sectionContent}>
                <TextInput
                  style={styles.textArea}
                  value={formData.notes}
                  onChangeText={(value) => handleChange('notes', value)}
                  placeholder="Enter mission notes..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            {/* Fuel Distribution */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Fuel Distribution</Text>
              </View>
              <View style={styles.fuelTable}>
                <View style={styles.fuelHeader}>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>OUTBD</Text>
                  </View>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>INBD</Text>
                  </View>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>AUX</Text>
                  </View>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>EXT</Text>
                  </View>
                  <View style={styles.fuelHeaderCellLast}>
                    <Text style={styles.fuelHeaderText}>FUS</Text>
                  </View>
                </View>
                <View style={styles.fuelRow}>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(formData.fuelDistribution.outbd ?? 0).toString()}
                      onChangeText={(value) => handleChange('fuelDistribution.outbd', parseInt(value, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(formData.fuelDistribution.inbd ?? 0).toString()}
                      onChangeText={(value) => handleChange('fuelDistribution.inbd', parseInt(value, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(formData.fuelDistribution.aux ?? 0).toString()}
                      onChangeText={(value) => handleChange('fuelDistribution.aux', parseInt(value, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(formData.fuelDistribution.ext ?? 0).toString()}
                      onChangeText={(value) => handleChange('fuelDistribution.ext', parseInt(value, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCellLast}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(formData.fuelDistribution.fuselage ?? 0).toString()}
                      onChangeText={(value) => handleChange('fuelDistribution.fuselage', parseInt(value, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.fuelTotalRow}>
                  <View style={styles.fuelTotalLabel}>
                    <Text style={styles.fuelTotalText}>Total Fuel</Text>
                  </View>
                  <View style={styles.fuelTotalValue}>
                    <Text style={styles.fuelTotalText}>{totalFuel.toLocaleString()} lbs</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Add New Cargo */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add New Cargo</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.addCargoForm}>
                  <View style={styles.addCargoRow}>
                    <View style={styles.addCargoField}>
                      <Text style={styles.labelSmall}>Name</Text>
                      <TextInput
                        style={styles.input}
                        value={newCargoName}
                        onChangeText={setNewCargoName}
                        placeholder="Cargo name"
                      />
                    </View>
                    <View style={styles.addCargoFieldSmall}>
                      <Text style={styles.labelSmall}>Weight</Text>
                      <TextInput
                        style={styles.input}
                        value={newCargoWeight}
                        onChangeText={setNewCargoWeight}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.addCargoFieldSmall}>
                      <Text style={styles.labelSmall}>FS</Text>
                      <TextInput
                        style={styles.input}
                        value={newCargoFs}
                        onChangeText={setNewCargoFs}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddCargo}
                  >
                    <Text style={styles.addButtonText}>+ Add to Deck</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Cargo Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cargo on Deck ({onDeckItems.length})</Text>
              </View>
              <View style={styles.sectionContent}>
                {onDeckItems.length > 0 ? (
                  <View style={styles.cargoTable}>
                    <View style={styles.cargoHeader}>
                      <View style={[styles.cargoHeaderCell, styles.colName]}>
                        <Text style={styles.cargoHeaderText}>Name</Text>
                      </View>
                      <View style={[styles.cargoHeaderCell, styles.colWeight]}>
                        <Text style={styles.cargoHeaderText}>Weight</Text>
                      </View>
                      <View style={[styles.cargoHeaderCell, styles.colFs]}>
                        <Text style={styles.cargoHeaderText}>FS</Text>
                      </View>
                      <View style={[styles.cargoHeaderCellLast, styles.colAction]}>
                        <Text style={styles.cargoHeaderText}>⚙</Text>
                      </View>
                    </View>
                    {onDeckItems.map((item) => (
                      <View key={item.id} style={styles.cargoRow}>
                        <View style={[styles.cargoCell, styles.colName]}>
                          <TextInput
                            style={styles.cargoInput}
                            value={item.name || ''}
                            onChangeText={(value) => {
                              if (onUpdateItem) {
                                onUpdateItem({ ...item, name: value });
                              }
                            }}
                            placeholder="Name"
                          />
                        </View>
                        <View style={[styles.cargoCell, styles.colWeight]}>
                          <TextInput
                            style={styles.cargoInput}
                            value={(item.weight ?? 0).toString()}
                            onChangeText={(value) => {
                              if (onUpdateItem) {
                                onUpdateItem({ ...item, weight: parseInt(value, 10) || 0 });
                              }
                            }}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={[styles.cargoCell, styles.colFs]}>
                          <TextInput
                            style={styles.cargoInput}
                            value={(item.fs ?? 0).toString()}
                            onChangeText={(value) => {
                              if (onUpdateItem) {
                                onUpdateItem({ ...item, fs: parseInt(value, 10) || 0 });
                              }
                            }}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={[styles.cargoCellLast, styles.colAction]}>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => onRemoveFromDeck && onRemoveFromDeck(item.id)}
                          >
                            <Text style={styles.removeButtonText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No cargo items on deck</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Save Mission Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default React.memo(MissionSettingsComponent);
