import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { styles } from './MissionSettings.styles';
import { CargoItem, Position } from '../../types';
import { DEFAULT_CARGO_TYPE_ID, DEFAULT_Y_POS } from '../../constants';
import { fsToXPosition } from '../../utils/cargoUtils';
import InlineEditField from './InlineEditField';

type ManualCargoInsertionProps = {
  cargoItems: CargoItem[];
  onAddCargoItem?: (item: CargoItem, status: 'inventory' | 'onStage' | 'onDeck') => void;
  onRemoveItem?: (id: string) => void;
  onUpdateItem?: (item: CargoItem) => void;
};

const DEFAULT_DIMENSIONS = {
  width: 50,
  length: 50,
  height: 50,
};

const DOCK_OPTIONS = ['Front', 'Back', 'CG'] as const;
type DockType = typeof DOCK_OPTIONS[number];

const calculateChange = (_fs: number, _weight: number): number => {
  // Will be implemented later, returning 0 for now
  return 0;
};

const calculateIndex = (_fs: number, _weight: number): number => {
  // Will be implemented later, returning 0 for now
  return 0;
};

const calculatePosition = (fs: number, cog: number): Position => {
  const x_pos = fsToXPosition(fs, cog);
  const y_pos = DEFAULT_Y_POS;
  return { x: x_pos, y: y_pos };
};

function ManualCargoInsertion({ cargoItems = [], onAddCargoItem, onRemoveItem, onUpdateItem }: ManualCargoInsertionProps) {
  const [fs, setFs] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dock, setDock] = useState<DockType>('CG');

  const handleToggleDock = () => {
    const currentIndex = DOCK_OPTIONS.indexOf(dock);
    const nextIndex = (currentIndex + 1) % DOCK_OPTIONS.length;
    setDock(DOCK_OPTIONS[nextIndex]);
  };

  const handleAddCargoItem = () => {
    if (!fs || !name || !weight) { return; }

    const tempId = Date.now().toString();
    const parsedWeight = parseInt(weight, 10) || 0;
    const parsedFs = parseInt(fs, 10) || 0;

    // Validate that FS is greater than 0 for onDeck items
    if (parsedFs <= 0) {
      Alert.alert('Invalid FS', 'FS must be greater than 0 for deck items');
      return;
    }

    // Create the item for the manual cargo insertion table
    const cog = DEFAULT_DIMENSIONS.length / 2;
    const length = DEFAULT_DIMENSIONS.length;

    const newItem: CargoItem = {
      // this is a temporary id, it will be replaced with the actual id when the item is saved
      id: tempId,
      fs: parsedFs,
      name,
      weight: parsedWeight,
      cargo_type_id: DEFAULT_CARGO_TYPE_ID,
      length: length,
      width: DEFAULT_DIMENSIONS.width,
      height: DEFAULT_DIMENSIONS.height,
      cog,
      status: 'onDeck',
      position: calculatePosition(parsedFs, cog),
      dock: dock,
    };

    onAddCargoItem?.(newItem, 'onDeck');

    // Reset form fields
    setFs('');
    setName('');
    setWeight('');
    setDock('CG');
  };

  const handleRemoveItem = (id: string) => {
    // Also remove from the deck if the callback is provided
    if (onRemoveItem) {
      onRemoveItem(id);
    }
  };

  const handleFieldUpdate = (item: CargoItem, field: keyof CargoItem, value: string | number) => {
    try {
      if (onUpdateItem) {
        const updatedItem = { ...item, [field]: value };
        console.log('Updating field:', field, 'with value:', value, 'for item:', item.id);
        onUpdateItem(updatedItem);
      } else {
        console.warn('onUpdateItem callback not provided');
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  return (
    <View style={styles.formGroup}>
      <Text style={styles.sectionTitle}>Manual Cargo Insertion</Text>
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 0.7 }]}>
          <Text style={styles.labelSmall}>FS:</Text>
          <TextInput
            style={styles.input}
            value={fs}
            onChangeText={setFs}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.labelSmall}>Dock:</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#555', height: 32, width: '100%' }]}
            onPress={handleToggleDock}
          >
            <Text style={styles.addButtonText}>{dock}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.inputGroup, { flex: 1.5 }]}>
          <Text style={styles.labelSmall}>Cargo Name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter cargo name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.labelSmall}>Weight (lbs):</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCargoItem}
        >
          <Text style={styles.addButtonText}>Add Cargo Item</Text>
        </TouchableOpacity>
      </View>

      {cargoItems.length > 0 && (
        <View style={styles.cargoList}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <Text style={styles.tableHeaderText}>FS</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>Dock</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text style={styles.tableHeaderText}>Name</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>Weight</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>Change</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>Index</Text>
              </View>
              <View style={[styles.tableCell, { width: 20, borderRightWidth: 0 }]}>
                <Text style={styles.tableHeaderText} />
              </View>
            </View>

            {/* Table Body */}
            <ScrollView>
              {cargoItems.filter((item) => item.status === 'onDeck').map((item) => {
                const change = calculateChange(item.fs, item.weight);
                const index = calculateIndex(item.fs, item.weight);

                return (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 0.8 }]}>
                      <InlineEditField
                        value={item.fs}
                        onSave={(value) => handleFieldUpdate(item, 'fs', value)}
                        keyboardType="numeric"
                        textStyle={styles.tableCellText}
                        inputStyle={[styles.tableCellText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' }]}
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <InlineEditField
                        value={item.dock || 'CG'}
                        onSave={(value) => handleFieldUpdate(item, 'dock', value)}
                        textStyle={styles.tableCellText}
                        inputStyle={[styles.tableCellText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' }]}
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <InlineEditField
                        value={item.name}
                        onSave={(value) => handleFieldUpdate(item, 'name', value)}
                        textStyle={styles.tableCellText}
                        inputStyle={[styles.tableCellText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' }]}
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <InlineEditField
                        value={item.weight}
                        onSave={(value) => handleFieldUpdate(item, 'weight', value)}
                        keyboardType="numeric"
                        textStyle={styles.tableCellText}
                        inputStyle={[styles.tableCellText, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' }]}
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <Text style={styles.tableCellText}>{change}</Text>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <Text style={styles.tableCellText}>{index}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: 25, borderRightWidth: 0, alignItems: 'center' }]}>
                      <TouchableOpacity
                        style={styles.removeButtonSmall}
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <Text style={styles.removeButtonText}>x</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

export default ManualCargoInsertion;
