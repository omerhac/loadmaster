import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { CargoItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';

type AddCargoItemModalProps = {
  initialItem?: CargoItem;
  onSave: (item: CargoItem) => void;
  onCancel: () => void;
};

const AddCargoItemModal = ({
  initialItem,
  onSave,
  onCancel,
}: AddCargoItemModalProps) => {
  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [cog, setCog] = useState('');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setLength(initialItem.length.toString());
      setWidth(initialItem.width.toString());
      setHeight(initialItem.height.toString());
      setWeight(initialItem.weight.toString());
      setCog(initialItem.cog.toString());
    }
  }, [initialItem]);

  const handleSave = () => {
    const item: CargoItem = {
      id: initialItem?.id || uuidv4(),
      name: name,
      length: parseInt(length, 10) || 0,
      width: parseInt(width, 10) || 0,
      height: parseInt(height, 10) || 0,
      weight: parseInt(weight, 10) || 0,
      cog: parseInt(cog, 10) || 50,
      status: initialItem?.status || 'inventory',
      position: initialItem?.position || { x: -1, y: -1 },
    };
    onSave(item);
  };

  const isValid = () => {
    return (
      name.trim() !== '' &&
      !isNaN(parseInt(length, 10)) &&
      !isNaN(parseInt(width, 10)) &&
      !isNaN(parseInt(height, 10)) &&
      !isNaN(parseInt(weight, 10))
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalContainer}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {initialItem ? 'Edit Cargo Item' : 'Add New Cargo Item'}
        </Text>
        
        <ScrollView style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
          />

          <Text style={styles.label}>Length (cm)</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={setLength}
            keyboardType="numeric"
            placeholder="Enter length"
          />

          <Text style={styles.label}>Width (cm)</Text>
          <TextInput
            style={styles.input}
            value={width}
            onChangeText={setWidth}
            keyboardType="numeric"
            placeholder="Enter width"
          />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="Enter height"
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Enter weight"
          />

          <Text style={styles.label}>Center of Gravity (%)</Text>
          <TextInput
            style={styles.input}
            value={cog}
            onChangeText={setCog}
            keyboardType="numeric"
            placeholder="Enter COG (0-100)"
          />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.saveButton,
              !isValid() && styles.disabledButton
            ]} 
            onPress={handleSave}
            disabled={!isValid()}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#b3d9ff',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default AddCargoItemModal; 