import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { styles } from './MissionSettings.styles';
import { ManualCargoItem } from '../../types';

type ManualCargoInsertionProps = {
  cargoItems: ManualCargoItem[];
  onChange: (name: string, value: ManualCargoItem[]) => void;
};

const CELL_OPTIONS = ['C', 'D', 'E', 'F', 'G', 'H'];
const DEFAULT_DIMENSIONS = {
  width: 100,
  length: 100,
  height: 100,
};

const calculateChange = (_cell: string, _fs: number, _weight: number): number => {
  // Will be implemented later, returning 0 for now
  return 0;
};

const calculateIndex = (_cell: string, _fs: number, _weight: number): number => {
  // Will be implemented later, returning 0 for now
  return 0;
};

function ManualCargoInsertion({ cargoItems = [], onChange }: ManualCargoInsertionProps) {
  const [cell, setCell] = useState<string>(CELL_OPTIONS[0]);
  const [fs, setFs] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [showCellDropdown, setShowCellDropdown] = useState(false);

  const handleAddCargoItem = () => {
    if (!fs || !name || !weight) return;

    const newItem: ManualCargoItem = {
      id: Date.now().toString(),
      cell,
      fs: parseInt(fs, 10) || 0,
      name,
      weight: parseInt(weight, 10) || 0,
      width: DEFAULT_DIMENSIONS.width,
      length: DEFAULT_DIMENSIONS.length,
      height: DEFAULT_DIMENSIONS.height,
    };

    const updatedCargoItems = [...cargoItems, newItem];
    onChange('cargoItems', updatedCargoItems);

    // Reset form fields
    setCell(CELL_OPTIONS[0]);
    setFs('');
    setName('');
    setWeight('');
  };

  const handleRemoveItem = (id: string) => {
    const updatedCargoItems = cargoItems.filter(item => item.id !== id);
    onChange('cargoItems', updatedCargoItems);
  };

  const selectCell = (selectedCell: string) => {
    setCell(selectedCell);
    setShowCellDropdown(false);
  };

  return (
    <View style={styles.formGroup}>
      <Text style={styles.sectionTitle}>Manual Cargo Insertion</Text>
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 0.5 }]}>
          <Text style={styles.labelSmall}>Cell:</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowCellDropdown(true)}
          >
            <Text style={styles.dropdownButtonText}>{cell}</Text>
          </TouchableOpacity>
          <Modal
            visible={showCellDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCellDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCellDropdown(false)}
            >
              <View style={styles.modalContent}>
                <ScrollView>
                  {CELL_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.optionItem}
                      onPress={() => selectCell(option)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

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
      </View>

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleAddCargoItem}
      >
        <Text style={styles.addButtonText}>Add Cargo Item</Text>
      </TouchableOpacity>

      {cargoItems.length > 0 && (
        <View style={styles.cargoList}>
          
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <Text style={styles.tableHeaderText}>Cell</Text>
              </View>
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
                <Text style={styles.tableHeaderText}></Text>
              </View>
            </View>
            
            {/* Table Body */}
            <ScrollView>
              {cargoItems.map((item) => {
                const change = calculateChange(item.cell, item.fs, item.weight);
                const index = calculateIndex(item.cell, item.fs, item.weight);
                
                return (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 0.8 }]}>
                      <Text style={styles.tableCellText}>{item.cell}</Text>
                    </View>
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
                    <View style={[styles.tableCell, { width: 50, borderRightWidth: 0, alignItems: 'center' }]}>
                      <TouchableOpacity
                        style={styles.removeButtonSmall}
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <Text style={styles.removeButtonText}>X</Text>
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