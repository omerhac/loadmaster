import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './MissionSettings.styles';
import { CargoItem, ManualCargoItem, Position } from '../../types';

type ManualCargoInsertionProps = {
  cargoItems: ManualCargoItem[];
  onChange: (name: string, value: ManualCargoItem[]) => void;
  onAddCargoItem?: (item: CargoItem, status: 'inventory' | 'onStage' | 'onDeck') => void;
};

const DEFAULT_DIMENSIONS = {
  width: 50,
  length: 50,
  height: 50,
};

const calculateChange = (_fs: number, _weight: number): number => {
  // Will be implemented later, returning 0 for now
  return 0;
};

const calculateIndex = (_fs: number, _weight: number): number => {
  // Will be implemented later, returning 0 for now
  return 0;
};

const calculatePosition = (_fs: number): Position => {
  // Will be implemented later, returning {0, 0} for now
  return { x: 0, y: 0 };
};

function ManualCargoInsertion({ cargoItems = [], onChange, onAddCargoItem }: ManualCargoInsertionProps) {
  const [fs, setFs] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const handleAddCargoItem = () => {
    if (!fs || !name || !weight) { return; }

    const id = Date.now().toString();
    const parsedWeight = parseInt(weight, 10) || 0;
    const parsedFs = parseInt(fs, 10) || 0;

    // Create the item for the manual cargo insertion table
    const newItem: ManualCargoItem = {
      id,
      fs: parsedFs,
      name,
      weight: parsedWeight,
    };

    // Add to the mission settings cargo items list
    const updatedCargoItems = [...cargoItems, newItem];
    onChange('cargoItems', updatedCargoItems);

    // If onAddCargoItem is provided, also add to the main cargo items list
    if (onAddCargoItem) {
      const cargoItem: CargoItem = {
        id,
        cargo_type_id: 1, // Default cargo type
        name,
        fs: parsedFs,
        length: DEFAULT_DIMENSIONS.length,
        width: DEFAULT_DIMENSIONS.width,
        height: DEFAULT_DIMENSIONS.height,
        cog: DEFAULT_DIMENSIONS.length / 2,
        weight: parsedWeight,
        status: 'onDeck', // Default status as requested
        position: calculatePosition(parsedFs),
      };

      onAddCargoItem(cargoItem, 'onDeck');
    }

    // Reset form fields
    setFs('');
    setName('');
    setWeight('');
  };

  const handleRemoveItem = (id: string) => {
    const updatedCargoItems = cargoItems.filter(item => item.id !== id);
    onChange('cargoItems', updatedCargoItems);
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
              {cargoItems.map((item) => {
                const change = calculateChange(item.fs, item.weight);
                const index = calculateIndex(item.fs, item.weight);

                return (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 0.8 }]}>
                      <Text style={styles.tableCellText}>{item.fs}</Text>
                    </View>
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <Text style={styles.tableCellText}>{item.name}</Text>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <Text style={styles.tableCellText}>{item.weight}</Text>
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