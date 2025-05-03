import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CargoItem } from '../../types';
import { lockToLandscape } from '../../utils/orientationLock';

type AddCargoItemModalProps = {
  initialItem?: CargoItem;
  onSave: (item: CargoItem) => void;
  onCancel: () => void;
  savedPresets?: CargoItem[];
};

const AddCargoItemModal = ({ initialItem, onSave, onCancel, savedPresets = [] }: AddCargoItemModalProps) => {
  const [name, setName] = useState('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [cog, setCog] = useState<string>('');
  const [showPresets, setShowPresets] = useState(false);

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
      setLength('');
      setWidth('');
      setHeight('');
      setWeight('');
      setCog('');
    }
  }, [initialItem]);

  // Ensure we stay in landscape mode
  useEffect(() => {
    lockToLandscape();
  }, []);

  // Check if form data is valid
  const isDataValid = () => {
    return (
      name.trim() !== '' &&
      parseFloat(length || '0') > 0 &&
      parseFloat(width || '0') > 0 &&
      parseFloat(height || '0') > 0 &&
      parseFloat(weight || '0') > 0
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!isDataValid()) return;

    // Generate a simple ID without using uuid
    const generateID = () => {
      return Date.now().toString() + Math.floor(Math.random() * 1000000).toString();
    };

    const cogValue = parseFloat(cog || '0');
    const lengthValue = parseFloat(length);
    
    const itemToSave: CargoItem = {
      id: initialItem?.id || generateID(),
      name,
      length: lengthValue,
      width: parseFloat(width),
      height: parseFloat(height),
      weight: parseFloat(weight),
      cog: cogValue > 0 ? cogValue : lengthValue / 2, // Default to half length if not set
      status: initialItem?.status || 'inventory',
      position: initialItem?.position || { x: -1, y: -1 },
    };

    onSave(itemToSave);
  };

  // Update COG when length changes
  useEffect(() => {
    const lengthValue = parseFloat(length || '0');
    if (lengthValue > 0) {
      setCog((lengthValue / 2).toFixed(1));
    }
  }, [length]);

  // Handle loading a preset
  const handleLoadPreset = (preset: CargoItem) => {
    setName(preset.name);
    setLength(preset.length.toString());
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
    setWeight(preset.weight.toString());
    setCog(preset.cog.toString());
    setShowPresets(false);
  };

  // Toggle preset dropdown visibility
  const togglePresetDropdown = () => {
    if (savedPresets.length === 0) {
      Alert.alert(
        "No Presets Available",
        "You haven't saved any presets yet. You can save an item as a preset from the item's menu.",
        [{ text: "OK" }]
      );
      return;
    }
    setShowPresets(!showPresets);
  };

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

                {/* Load Preset Button */}
                <View style={styles.presetContainer}>
                  <TouchableOpacity
                    style={styles.loadPresetButton}
                    onPress={togglePresetDropdown}
                  >
                    <Text style={styles.loadPresetText}>Load Preset</Text>
                  </TouchableOpacity>
                  
                  {/* Preset Dropdown */}
                  {showPresets && savedPresets.length > 0 && (
                    <View style={styles.presetDropdown}>
                      <FlatList
                        data={savedPresets}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.presetItem}
                            onPress={() => handleLoadPreset(item)}
                          >
                            <Text style={styles.presetItemName}>{item.name}</Text>
                            <Text style={styles.presetItemDimensions}>
                              {`${item.length}" x ${item.width}" x ${item.height}"`}
                            </Text>
                          </TouchableOpacity>
                        )}
                        style={styles.presetList}
                      />
                    </View>
                  )}
                </View>

                {/* Compact Form Layout */}
                <View style={styles.compactFormContainer}>
                  {/* First Row: Name */}
                  <View style={styles.formRow}>
                    <View style={styles.formFullWidth}>
                      <Text style={styles.label}>Name</Text>
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Item Name"
                      />
                    </View>
                  </View>

                  {/* Second Row: Dimensions */}
                  <View style={styles.formRow}>
                    <View style={styles.formColumn}>
                      <Text style={styles.label}>Length (in)</Text>
                      <TextInput
                        style={styles.input}
                        value={length}
                        onChangeText={setLength}
                        keyboardType="numeric"
                        placeholder="Length"
                      />
                    </View>

                    <View style={styles.formColumn}>
                      <Text style={styles.label}>Width (in)</Text>
                      <TextInput
                        style={styles.input}
                        value={width}
                        onChangeText={setWidth}
                        keyboardType="numeric"
                        placeholder="Width"
                      />
                    </View>

                    <View style={styles.formColumn}>
                      <Text style={styles.label}>Height (in)</Text>
                      <TextInput
                        style={styles.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="Height"
                      />
                    </View>

                    <View style={styles.formColumn}>
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

                  {/* Third Row: Center of Gravity */}
                  <View style={styles.formRow}>
                    <View style={styles.formFullWidth}>
                      <Text style={styles.label}>Center of Gravity (inches from front)</Text>
                      <View style={styles.cogContainer}>
                        <Slider
                          style={styles.slider}
                          minimumValue={0}
                          maximumValue={parseFloat(length || '0') > 0 ? parseFloat(length) : 1}
                          value={parseFloat(cog || '0')}
                          onValueChange={value => setCog(value.toFixed(1))}
                          minimumTrackTintColor="#0066cc"
                          maximumTrackTintColor="#d3d3d3"
                          thumbTintColor="#0066cc"
                          disabled={parseFloat(length || '0') <= 0}
                        />
                        <TextInput
                          style={styles.cogInput}
                          value={cog}
                          onChangeText={setCog}
                          keyboardType="numeric"
                          placeholder="COG"
                          editable={parseFloat(length || '0') > 0}
                        />
                      </View>
                    </View>
                  </View>
                </View>

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
    width: '80%',
    maxWidth: 800,
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
    marginBottom: 10,
    color: '#333',
  },
  presetContainer: {
    position: 'relative',
    marginBottom: 15,
    zIndex: 2,
  },
  loadPresetButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadPresetText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  presetDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 3,
  },
  presetList: {
    maxHeight: 150,
  },
  presetItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  presetItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  presetItemDimensions: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  compactFormContainer: {
    padding: 5,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    width: '100%',
  },
  formColumn: {
    width: '24%',
    paddingHorizontal: 5,
  },
  formFullWidth: {
    width: '100%',
    paddingHorizontal: 5,
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
    padding: 8,
    fontSize: 14,
    height: 38,
  },
  cogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    height: 38,
    marginRight: 10,
  },
  cogInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 80,
    textAlign: 'center',
    height: 38,
  },
  buttonContainer: {
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    height: 44,
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
