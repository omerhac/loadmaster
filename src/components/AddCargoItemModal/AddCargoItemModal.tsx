import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { CargoItem } from '../../types';

type AddCargoItemModalProps = {
  initialItem?: CargoItem;
  onSave: (item: CargoItem) => void;
  onCancel: () => void;
};

const AddCargoItemModal = ({ initialItem, onSave, onCancel }: AddCargoItemModalProps) => {
  const [name, setName] = useState('');
  const [length, setLength] = useState<string>('0');
  const [width, setWidth] = useState<string>('0');
  const [height, setHeight] = useState<string>('0');
  const [weight, setWeight] = useState<string>('0');
  const [cog, setCog] = useState<string>('0');

  // Set initial values if editing an existing item
  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setLength(initialItem.length.toString());
      setWidth(initialItem.width.toString());
      setHeight(initialItem.height.toString());
      setWeight(initialItem.weight.toString());
      setCog(initialItem.cog.toString());
    } else {
      setName('');
      setLength('0');
      setWidth('0');
      setHeight('0');
      setWeight('0');
      setCog('0');
    }
  }, [initialItem]);

  // Check if form data is valid
  const isDataValid = () => {
    return (
      name.trim() !== '' &&
      parseFloat(length) > 0 &&
      parseFloat(width) > 0 &&
      parseFloat(height) > 0 &&
      parseFloat(weight) > 0 &&
      parseFloat(cog) > 0 &&
      parseFloat(cog) <= parseFloat(length)
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!isDataValid()) {return;}

    const itemToSave: CargoItem = {
      id: initialItem?.id || uuidv4(),
      name,
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      weight: parseFloat(weight),
      cog: parseFloat(cog),
      status: initialItem?.status || 'inventory',
      position: initialItem?.position || { x: -1, y: -1 },
    };

    onSave(itemToSave);
  };

  // Update COG when length changes
  useEffect(() => {
    if (parseFloat(length) > 0 && (!initialItem || parseFloat(cog) === 0)) {
      setCog((parseFloat(length) / 2).toString());
    }
  }, [length, initialItem, cog]);

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
      presentationStyle="overFullScreen"
      supportedOrientations={[
        'landscape-left',
        'landscape-right',
      ]}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>
                  {initialItem ? 'Edit Item' : 'Add New Item'}
                </Text>

                <Text style={styles.modalDescription}>
                  {initialItem ? 'Update cargo details' : 'Enter cargo details'}
                </Text>

                <ScrollView style={styles.formContainer}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Item Name"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.label}>Length (inches)</Text>
                      <TextInput
                        style={styles.input}
                        value={length}
                        onChangeText={(val) => {
                          setLength(val);
                          // Auto-update COG to half length when length changes
                          if (parseFloat(val) > 0 && (!initialItem || parseFloat(cog) === 0)) {
                            setCog((parseFloat(val) / 2).toString());
                          }
                        }}
                        keyboardType="numeric"
                        placeholder="Length"
                      />
                    </View>

                    <View style={styles.formGroupHalf}>
                      <Text style={styles.label}>Width (inches)</Text>
                      <TextInput
                        style={styles.input}
                        value={width}
                        onChangeText={setWidth}
                        keyboardType="numeric"
                        placeholder="Width"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.label}>Height (inches)</Text>
                      <TextInput
                        style={styles.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="Height"
                      />
                    </View>

                    <View style={styles.formGroupHalf}>
                      <Text style={styles.label}>Weight (lbs)</Text>
                      <TextInput
                        style={styles.input}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder="Weight"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Center of Gravity (inches from front)</Text>
                    <TextInput
                      style={styles.input}
                      value={cog}
                      onChangeText={setCog}
                      keyboardType="numeric"
                      placeholder="COG"
                    />
                  </View>
                </ScrollView>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.saveButton, !isDataValid() && styles.saveButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!isDataValid()}
                  >
                    <Text style={styles.saveButtonText}>
                      {initialItem ? 'Update Item' : 'Add Item'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: Platform.OS === 'web' ? '50%' : '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  formContainer: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  formGroupHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#b3b3b3',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddCargoItemModal;
