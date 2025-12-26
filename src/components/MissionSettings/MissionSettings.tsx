import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { MissionSettings, FuelDistribution, CargoItem } from '../../types';
import { styles } from '../Preview/Preview.styles';
import LocationDropdown from './LocationDropdown';
import {
  calculateMACIndex,
  calculateMACPercent,
  calculateTotalAircraftWeight,
  calculateFuelMAC,
  calculateAdditionalWeightsMAC,
  getEmptyAircraftMACIndex,
  calculateAircraftCG,
  calculateLoadmastersIndex,
  calculateBaseWeight,
  calculateTotalFuelWeight,
  calculateCargoWeight,
  calculateCargoMACIndex,
  calculateTotalIndex,
  calculateZeroFuelWeight,
} from '../../services/mac';
import {
  DEFAULT_SAFETY_GEAR_WEIGHT,
  DEFAULT_OUTBOARD_FUEL,
  DEFAULT_INBOARD_FUEL,
  DEFAULT_FUSELAGE_FUEL,
  DEFAULT_AUXILIARY_FUEL,
  DEFAULT_EXTERNAL_FUEL,
  DEFAULT_AIRCRAFT_ID,
  DEFAULT_LOADMASTER_WEIGHT,
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
  foodWeight: 0,
  crewGearWeight: 0,
  etcWeight: 0,
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

interface CalculatedValues {
  macPercent: number;
  totalWeight: number;
  zeroFuelWeight: number;
  baseWeight: number;
  totalFuelWeight: number;
  cargoWeight: number;
  cargoMACIndex: number;
  fuelMACIndex: number;
  additionalWeightsMACIndex: number;
  emptyAircraftMACIndex: number;
  loadmastersIndex: number;
  totalIndex: number;
  aircraftCG: number;
}

const MissionSettingsComponent: React.FC<MissionSettingsProps> = ({
  settings,
  cargoItems,
  onSave,
  onAddToMainCargo,
  onRemoveFromDeck,
  onUpdateItem,
}) => {
  const [formData, setFormData] = useState<MissionSettings>(settings || DEFAULT_MISSION_SETTINGS);
  const [macIndices, setMacIndices] = useState<Record<string, number>>({});
  const [calculatedValues, setCalculatedValues] = useState<CalculatedValues | null>(null);
  const [newCargoName, setNewCargoName] = useState('');
  const [newCargoWeight, setNewCargoWeight] = useState('');
  const [newCargoFs, setNewCargoFs] = useState('');

  const onDeckItems = cargoItems.filter(item => item.status === 'onDeck');
  const onDeckItemIds = onDeckItems.map(i => i.id).join(',');
  const missionId = formData?.id ? parseInt(String(formData.id), 10) : null;
  const aircraftId = formData?.aircraftId ? parseInt(String(formData.aircraftId), 10) : null;

  useEffect(() => {
    if (settings) {
      setFormData({
        ...DEFAULT_MISSION_SETTINGS,
        ...settings,
        fuelDistribution: { ...DEFAULT_MISSION_SETTINGS.fuelDistribution, ...settings.fuelDistribution },
      });
    }
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    const fetchCalculations = async () => {
      if (!missionId || isNaN(missionId)) {return;}

      try {
        // Fetch cargo MAC indices
        const indices: Record<string, number> = {};
        const currentDeckItems = cargoItems.filter(item => item.status === 'onDeck');
        for (const item of currentDeckItems) {
          if (item.id && !cancelled) {
            try {
              const itemId = parseInt(item.id, 10);
              if (!isNaN(itemId)) {
                indices[item.id] = await calculateMACIndex(itemId);
              }
            } catch { indices[item.id] = 0; }
          }
        }
        if (cancelled) {return;}
        setMacIndices(indices);

        // Fetch all other calculations
        const results = await Promise.all([
          calculateMACPercent(missionId).catch(() => 0),
          calculateTotalAircraftWeight(missionId).catch(() => 0),
          calculateZeroFuelWeight(missionId).catch(() => 0),
          calculateBaseWeight(missionId).catch(() => 0),
          calculateTotalFuelWeight(missionId).catch(() => 0),
          calculateCargoWeight(missionId).catch(() => 0),
          calculateCargoMACIndex(missionId).catch(() => 0),
          calculateFuelMAC(missionId).catch(() => 0),
          calculateAdditionalWeightsMAC(missionId).catch(() => 0),
          calculateLoadmastersIndex(missionId).catch(() => 0),
          calculateTotalIndex(missionId).catch(() => 0),
        ]);

        if (cancelled) {return;}

        const [
          macPercent, totalWeight, zeroFuelWeight, baseWeight,
          totalFuelWeight, cargoWeight, cargoMACIndex, fuelMACIndex,
          additionalWeightsMACIndex, loadmastersIndex, totalIndex,
        ] = results;

        let emptyAircraftMACIndex = 0;
        if (aircraftId && !isNaN(aircraftId)) {
          try { emptyAircraftMACIndex = await getEmptyAircraftMACIndex(aircraftId); } catch { /* ignore */ }
        }

        if (cancelled) {return;}

        let aircraftCG = 0;
        try { aircraftCG = await calculateAircraftCG(missionId, totalIndex); } catch { /* ignore */ }

        if (cancelled) {return;}

        setCalculatedValues({
          macPercent, totalWeight, zeroFuelWeight, baseWeight, totalFuelWeight,
          cargoWeight, cargoMACIndex, fuelMACIndex, additionalWeightsMACIndex,
          emptyAircraftMACIndex, loadmastersIndex, totalIndex, aircraftCG,
        });
      } catch (error) {
        console.warn('Failed to fetch calculations:', error);
      }
    };

    fetchCalculations();

    return () => { cancelled = true; };
  }, [missionId, aircraftId, onDeckItemIds, cargoItems, settings]);

  const handleChange = useCallback((name: string, value: string | number | boolean) => {
    if (name.startsWith('fuelDistribution.')) {
      const fuelField = name.split('.')[1] as keyof FuelDistribution;
      setFormData(prev => ({
        ...prev,
        fuelDistribution: { ...prev.fuelDistribution, [fuelField]: typeof value === 'number' ? value : parseInt(String(value), 10) || 0 },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleNumericChange = useCallback((name: string, value: string) => {
    handleChange(name, parseInt(value, 10) || 0);
  }, [handleChange]);

  const handleSubmit = useCallback(() => {
    onSave({
      ...formData,
      aircraftIndex: typeof formData.aircraftIndex === 'string' ? parseFloat(formData.aircraftIndex) || 0 : formData.aircraftIndex,
    });
  }, [formData, onSave]);

  const handleAddCargo = useCallback(() => {
    if (!onAddToMainCargo) {return;}
    const newItem: CargoItem = {
      id: `cargo-${Date.now()}`,
      cargo_type_id: DEFAULT_CARGO_TYPE_ID,
      name: newCargoName.trim() || `Cargo ${Date.now()}`,
      weight: parseInt(newCargoWeight, 10) || 0,
      length: 50, width: 50, height: 50, cog: 25,
      fs: parseInt(newCargoFs, 10) || 0,
      status: 'onDeck',
      position: { x: 0, y: 0 },
      dock: 'CG',
    };
    onAddToMainCargo(newItem, 'onDeck');
    setNewCargoName('');
    setNewCargoWeight('');
    setNewCargoFs('');
  }, [onAddToMainCargo, newCargoName, newCargoWeight, newCargoFs]);

  const getItemMACIndex = (item: CargoItem): number => item.id ? (macIndices[item.id] ?? 0) : 0;

  const fmt = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {return '-';}
    return num.toFixed(2);
  };

  const cv = calculatedValues;
  const fuel = formData.fuelDistribution;

  // Calculate cumulative indices
  const emptyIdx = cv?.emptyAircraftMACIndex ?? 0;
  const additionalIdx = cv?.additionalWeightsMACIndex ?? 0;
  const loadmastersIdx = cv?.loadmastersIndex ?? 0;
  const baseIdx = emptyIdx + additionalIdx + loadmastersIdx;
  const fuelIdx = cv?.fuelMACIndex ?? 0;
  const cargoIdx = cv?.cargoMACIndex ?? 0;

  let cumulative = 0;
  const emptyCum = (cumulative += emptyIdx);
  const additionalCum = (cumulative += additionalIdx);
  const loadmastersCum = (cumulative += loadmastersIdx);
  const baseCum = loadmastersCum;
  const fuelCum = (cumulative += fuelIdx);
  const cargoCum = (cumulative += cargoIdx);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.twoColumnRow}>
          {/* Left Column - Weight & Index + Cargo */}
          <View style={styles.column}>
            {/* Weight Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weight & Index</Text>
              </View>
              <View style={styles.weightTable}>
                <View style={styles.weightHeader}>
                  <View style={[styles.weightHeaderCell, styles.colName]}>
                    <Text style={styles.weightHeaderText}>Item</Text>
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colFs]}>
                    <Text style={styles.weightHeaderText} />
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colWeight]}>
                    <Text style={styles.weightHeaderText}>Weight(lb)</Text>
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colIndex]}>
                    <Text style={styles.weightHeaderText}>Idx</Text>
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colCum]}>
                    <Text style={styles.weightHeaderText}>Cumulative</Text>
                  </View>
                  <View style={[styles.weightHeaderCellLast, styles.colAction]}>
                    <Text style={styles.weightHeaderText} />
                  </View>
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Empty Aircraft</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.aircraftEmptyWeight ?? 0).toString()}
                      onChangeText={(v) => handleNumericChange('aircraftEmptyWeight', v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(emptyIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(emptyCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Safety Gear</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <TextInput
                      style={styles.inputSmall}
                      value={(formData.safetyGearWeight ?? 0).toString()}
                      onChangeText={(v) => handleNumericChange('safetyGearWeight', v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(additionalIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(additionalCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.weightText}>Loadmasters</Text>
                      <TextInput
                        style={[styles.inputSmall, { width: 40 }]}
                        value={(formData.loadmasters ?? 0).toString()}
                        onChangeText={(v) => handleNumericChange('loadmasters', v)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt((formData.loadmasters || 0) * 100)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(loadmastersIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(loadmastersCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={[styles.weightRow, styles.weightRowHighlight]}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightTextBold}>Base Weight</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={[styles.weightTextCenter, { fontWeight: 'bold' }]}>{fmt(cv?.baseWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={[styles.weightTextCenter, { fontWeight: 'bold' }]}>{fmt(baseIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={[styles.weightTextCenter, { fontWeight: 'bold' }]}>{fmt(baseCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Fuel</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(cv?.totalFuelWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(fuelIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(fuelCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

              </View>
            </View>

            {/* Cargo Items - Editable */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cargo ({onDeckItems.length})</Text>
              </View>
              <View style={styles.cargoTable}>
                <View style={styles.cargoHeader}>
                  <View style={[styles.cargoHeaderCell, styles.colName]}>
                    <Text style={styles.cargoHeaderText}>Item</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colFs]}>
                    <Text style={styles.cargoHeaderText}>FS</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colWeight]}>
                    <Text style={styles.cargoHeaderText}>Weight(lb)</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colIndex]}>
                    <Text style={styles.cargoHeaderText}>Idx</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colCum]}>
                    <Text style={styles.cargoHeaderText}>Cumulative</Text>
                  </View>
                  <View style={[styles.cargoHeaderCellLast, styles.colAction]}>
                    <Text style={styles.cargoHeaderText}>⚙</Text>
                  </View>
                </View>

                {/* Add new cargo row */}
                <View style={styles.cargoRow}>
                  <View style={[styles.cargoCell, styles.colName]}>
                    <TextInput
                      style={styles.cargoInput}
                      value={newCargoName}
                      onChangeText={setNewCargoName}
                      placeholder="Name"
                    />
                  </View>
                  <View style={[styles.cargoCell, styles.colFs]}>
                    <TextInput
                      style={styles.cargoInput}
                      value={newCargoFs}
                      onChangeText={setNewCargoFs}
                      keyboardType="numeric"
                      placeholder="FS"
                    />
                  </View>
                  <View style={[styles.cargoCell, styles.colWeight]}>
                    <TextInput
                      style={styles.cargoInput}
                      value={newCargoWeight}
                      onChangeText={setNewCargoWeight}
                      keyboardType="numeric"
                      placeholder="Wt"
                    />
                  </View>
                  <View style={[styles.cargoCell, styles.colIndex]}>
                    <Text style={styles.cargoText}>-</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colCum]}>
                    <Text style={styles.cargoText}>-</Text>
                  </View>
                  <View style={[styles.cargoCellLast, styles.colAction]}>
                    <TouchableOpacity style={[styles.removeButton, { backgroundColor: '#28a745' }]} onPress={handleAddCargo}>
                      <Text style={styles.removeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {onDeckItems.map((item, index) => {
                  // Calculate cumulative index up to this item
                  let itemCumIdx = fuelCum; // Start from fuel cumulative
                  for (let i = 0; i <= index; i++) {
                    itemCumIdx += getItemMACIndex(onDeckItems[i]);
                  }
                  return (
                    <View key={item.id || index} style={styles.cargoRow}>
                      <View style={[styles.cargoCell, styles.colName]}>
                        <TextInput
                          style={styles.cargoInput}
                          value={item.name || ''}
                          onChangeText={(v) => onUpdateItem?.({ ...item, name: v })}
                        />
                      </View>
                      <View style={[styles.cargoCell, styles.colFs]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <TouchableOpacity
                            style={{ paddingHorizontal: 4, paddingVertical: 2 }}
                            onPress={() => {
                              const newFs = (item.fs ?? 0) - 1;
                              onUpdateItem?.({ ...item, fs: newFs });
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#007bff', fontWeight: 'bold' }}>◀</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.cargoInput, { width: 45, textAlign: 'center' }]}
                            value={(item.fs ?? 0).toString()}
                            onChangeText={(v) => onUpdateItem?.({ ...item, fs: parseInt(v, 10) || 0 })}
                            keyboardType="numeric"
                          />
                          <TouchableOpacity
                            style={{ paddingHorizontal: 4, paddingVertical: 2 }}
                            onPress={() => {
                              const newFs = (item.fs ?? 0) + 1;
                              onUpdateItem?.({ ...item, fs: newFs });
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#007bff', fontWeight: 'bold' }}>▶</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={[styles.cargoCell, styles.colWeight]}>
                        <TextInput
                          style={styles.cargoInput}
                          value={(item.weight ?? 0).toString()}
                          onChangeText={(v) => onUpdateItem?.({ ...item, weight: parseInt(v, 10) || 0 })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.cargoCell, styles.colIndex]}>
                        <Text style={styles.cargoText}>{fmt(getItemMACIndex(item))}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colCum]}>
                        <Text style={styles.cargoText}>{fmt(itemCumIdx)}</Text>
                      </View>
                      <View style={[styles.cargoCellLast, styles.colAction]}>
                        <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveFromDeck?.(item.id)}>
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {onDeckItems.length > 0 && (
                  <View style={[styles.cargoRow, { backgroundColor: '#f0f0f0' }]}>
                    <View style={[styles.cargoCell, styles.colName]}>
                      <Text style={styles.weightTextBold}>Cargo Total</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colFs]}>
                      <Text style={styles.cargoText}>-</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colWeight]}>
                      <Text style={styles.weightTextBold}>{fmt(cv?.cargoWeight)}</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colIndex]}>
                      <Text style={styles.weightTextBold}>{fmt(cargoIdx)}</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colCum]}>
                      <Text style={styles.weightTextBold}>{fmt(cargoCum)}</Text>
                    </View>
                    <View style={[styles.cargoCellLast, styles.colAction]} />
                  </View>
                )}

                {/* Total Weight Summary */}
                <View style={[styles.cargoRow, styles.weightRowHighlight]}>
                  <View style={[styles.cargoCell, styles.colName]}>
                    <Text style={styles.weightTextBold}>Total Weight</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colFs]}>
                    <Text style={styles.cargoText}>-</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colWeight]}>
                    <Text style={[styles.weightTextBold, { fontSize: 13 }]}>{fmt(cv?.totalWeight)}</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colIndex]}>
                    <Text style={styles.cargoText}>-</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colCum]}>
                    <Text style={styles.weightTextBold}>{fmt(cargoCum)}</Text>
                  </View>
                  <View style={[styles.cargoCellLast, styles.colAction]} />
                </View>

                {/* MAC% Display */}
                <View style={{ backgroundColor: '#FFE135', padding: 8, alignItems: 'center', borderTopWidth: 2, borderTopColor: '#000' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                    MAC: {fmt(cv?.macPercent)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column - Flight Info & Fuel */}
          <View style={styles.columnSmall}>
            {/* Flight Info - Editable */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Flight Info</Text>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Mission</Text>
                <View style={styles.formValue}>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(v) => handleChange('name', v)}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Date</Text>
                <View style={styles.formValue}>
                  <TextInput
                    style={styles.input}
                    value={formData.date}
                    onChangeText={(v) => handleChange('date', v)}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Departure</Text>
                <View style={styles.formValue}>
                  <LocationDropdown
                    value={formData.departureLocation}
                    onSelect={(v) => handleChange('departureLocation', v)}
                    placeholder="Select"
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Arrival</Text>
                <View style={styles.formValue}>
                  <LocationDropdown
                    value={formData.arrivalLocation}
                    onSelect={(v) => handleChange('arrivalLocation', v)}
                    placeholder="Select"
                  />
                </View>
              </View>
            </View>

            {/* Fuel Distribution - Editable */}
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
                      value={(fuel.outbd ?? 0).toString()}
                      onChangeText={(v) => handleChange('fuelDistribution.outbd', parseInt(v, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(fuel.inbd ?? 0).toString()}
                      onChangeText={(v) => handleChange('fuelDistribution.inbd', parseInt(v, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(fuel.aux ?? 0).toString()}
                      onChangeText={(v) => handleChange('fuelDistribution.aux', parseInt(v, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCell}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(fuel.ext ?? 0).toString()}
                      onChangeText={(v) => handleChange('fuelDistribution.ext', parseInt(v, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fuelCellLast}>
                    <TextInput
                      style={styles.fuelInput}
                      value={(fuel.fuselage ?? 0).toString()}
                      onChangeText={(v) => handleChange('fuelDistribution.fuselage', parseInt(v, 10) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[styles.fuelRow, styles.weightRowHighlight]}>
                  <View style={[styles.fuelCell, { flex: 2 }]}>
                    <Text style={[styles.fuelText, { fontWeight: 'bold' }]}>Total</Text>
                  </View>
                  <View style={[styles.fuelCellLast, { flex: 3 }]}>
                    <Text style={[styles.fuelText, { fontWeight: 'bold' }]}>{fmt(cv?.totalFuelWeight)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Fuel Pods</Text>
                <Switch
                  value={formData.fuelPods}
                  onValueChange={(v) => handleChange('fuelPods', v)}
                  trackColor={{ false: '#ddd', true: '#007bff' }}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Save Mission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default React.memo(MissionSettingsComponent);
