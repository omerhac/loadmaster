import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './AddCargoItemModal.styles';
import PlatformSlider from '../shared/PlatformSlider';

interface AddCargoItemModalProps {
  initialItem?: CargoItem;
  onSave: (item: CargoItem) => void;
  onCancel: () => void;
  savedPresets?: CargoItem[];
}

// Form data type matching the pattern from MissionSettings
type CargoFormData = {
  name: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  cog: string;
  showPresets: boolean;
};

const DEFAULT_FORM_DATA: CargoFormData = {
  name: '',
  length: '',
  width: '',
  height: '',
  weight: '',
  cog: '',
  showPresets: false,
};

const AddCargoItemModal = ({ initialItem, onSave, onCancel, savedPresets = [] }: AddCargoItemModalProps) => {
  // Single state object like MissionSettings
  const [formData, setFormData] = useState<CargoFormData>(DEFAULT_FORM_DATA);

  // Single onChange handler like MissionSettings
  const handleChange = useCallback((name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Initialize form data when initialItem changes
  useEffect(() => {
    if (initialItem) {
      setFormData({
        name: initialItem.name,
        length: initialItem.length.toString(),
        width: initialItem.width.toString(),
        height: initialItem.height.toString(),
        weight: initialItem.weight.toString(),
        cog: initialItem.cog.toString(),
        showPresets: false,
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [initialItem]);

  // Auto-set COG when length changes and COG is empty (simplified, no loop)
  useEffect(() => {
    const lengthValue = parseFloat(formData.length || '0');
    if (lengthValue > 0 && formData.cog === '') {
      setFormData(prev => ({
        ...prev,
        cog: (lengthValue / 2).toFixed(1),
      }));
    }
  }, [formData.length, formData.cog]);

  // Validation
  const isDataValid =
    formData.name.trim() !== '' &&
    parseFloat(formData.length || '0') > 0 &&
    parseFloat(formData.width || '0') > 0 &&
    parseFloat(formData.height || '0') > 0 &&
    parseFloat(formData.weight || '0') > 0;

  const handleSubmit = useCallback(() => {
    if (!isDataValid) {return;}

    const cogValue = parseFloat(formData.cog || '0');
    const lengthValue = parseFloat(formData.length);

    const itemToSave: CargoItem = {
      id: initialItem?.id || '',
      name: formData.name,
      cargo_type_id: initialItem?.cargo_type_id || 1,
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      cog: cogValue > 0 ? cogValue : lengthValue / 2,
      fs: initialItem?.fs ?? 0,
      dock: initialItem?.dock ?? 'CoG',
      status: initialItem?.status || 'inventory',
      position: initialItem?.position || { x: -1, y: -1 },
    };

    onSave(itemToSave);
  }, [formData, initialItem, isDataValid, onSave]);

  const handleLoadPreset = useCallback((preset: CargoItem) => {
    setFormData({
      name: preset.name,
      length: preset.length.toString(),
      width: preset.width.toString(),
      height: preset.height.toString(),
      weight: preset.weight.toString(),
      cog: preset.cog.toString(),
      showPresets: false,
    });
  }, []);

  const togglePresetDropdown = useCallback(() => {
    if (savedPresets.length === 0) {
      Alert.alert(
        'No Presets Available',
        "You haven't saved any presets yet. You can save an item as a preset from the item's menu.",
        [{ text: 'OK' }]
      );
      return;
    }
    handleChange('showPresets', !formData.showPresets);
  }, [savedPresets.length, formData.showPresets, handleChange]);

  const renderPresetItem = useCallback(({ item }: { item: CargoItem }) => (
    <TouchableOpacity
      style={styles.presetItem}
      onPress={() => handleLoadPreset(item)}
    >
      <Text style={styles.presetItemName}>{item.name}</Text>
      <Text style={styles.presetItemDimensions}>
        {`${item.length}" x ${item.width}" x ${item.height}"`}
      </Text>
    </TouchableOpacity>
  ), [handleLoadPreset]);

  const handleSliderChange = useCallback((value: number) => {
    handleChange('cog', value.toFixed(1));
  }, [handleChange]);

  // Remove Portal wrapper and animations - use simple modal structure like MissionSettings
  const isWindows = Platform.OS === 'windows';
  const keyboardBehavior = isWindows ? 'padding' : (Platform.OS === 'ios' ? 'padding' : 'height');

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalContent}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
              {formData.showPresets && savedPresets.length > 0 && (
                <View style={styles.presetDropdown}>
                  <FlatList
                    data={savedPresets}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPresetItem}
                    style={styles.presetList}
                  />
                </View>
              )}
            </View>

            {/* Form Layout - Following MissionSettings pattern */}
            <View style={styles.compactFormContainer}>
              {/* Name Field */}
              <View style={styles.formRow}>
                <View style={styles.formFullWidth}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(value) => handleChange('name', value)}
                    placeholder="Item Name"
                  />
                </View>
              </View>

              {/* Dimensions and Weight */}
              <View style={styles.formRow}>
                <View style={styles.formColumnBetter}>
                  <Text style={styles.label}>Length (in)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.length}
                    onChangeText={(value) => handleChange('length', value)}
                    keyboardType="numeric"
                    placeholder="Length"
                  />
                </View>
                <View style={styles.formColumnBetter}>
                  <Text style={styles.label}>Width (in)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.width}
                    onChangeText={(value) => handleChange('width', value)}
                    keyboardType="numeric"
                    placeholder="Width"
                  />
                </View>
                <View style={styles.formColumnBetter}>
                  <Text style={styles.label}>Height (in)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.height}
                    onChangeText={(value) => handleChange('height', value)}
                    keyboardType="numeric"
                    placeholder="Height"
                  />
                </View>
                <View style={styles.formColumnBetter}>
                  <Text style={styles.label}>Weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.weight}
                    onChangeText={(value) => handleChange('weight', value)}
                    keyboardType="numeric"
                    placeholder="Weight"
                  />
                </View>
              </View>

              {/* Center of Gravity */}
              <View style={styles.formRow}>
                <View style={styles.formFullWidth}>
                  <Text style={styles.label}>Center of Gravity (inches from front)</Text>
                  <View style={styles.cogContainer}>
                    <PlatformSlider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={parseFloat(formData.length || '0') > 0 ? parseFloat(formData.length) : 1}
                      step={0.1}
                      value={parseFloat(formData.cog || '0')}
                      onValueChange={handleSliderChange}
                      minimumTrackTintColor="#0066cc"
                      maximumTrackTintColor="#d3d3d3"
                      thumbTintColor="#0066cc"
                      disabled={parseFloat(formData.length || '0') <= 0}
                      showValue={false}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, !isDataValid && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={!isDataValid}
              >
                <Text style={styles.saveButtonText}>
                  {initialItem ? 'Update Item' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddCargoItemModal;
