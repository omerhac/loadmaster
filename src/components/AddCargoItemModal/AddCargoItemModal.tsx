import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Animated,
} from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './AddCargoItemModal.styles';
import { Portal } from 'react-native-portalize';
import PlatformSlider from '../shared/PlatformSlider';

interface AddCargoItemModalProps {
  initialItem?: CargoItem;
  onSave: (item: CargoItem) => void;
  onCancel: () => void;
  savedPresets?: CargoItem[];
}

// Extract input field component to prevent re-renders
const FormField = React.memo<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  style?: any;
}>(({ label, value, onChangeText, placeholder, keyboardType = 'default', style }) => (
  <View style={[styles.formColumnBetter, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder}
    />
  </View>
));

FormField.displayName = 'FormField';

const AddCargoItemModal = ({ initialItem, onSave, onCancel, savedPresets = [] }: AddCargoItemModalProps) => {
  const [name, setName] = useState('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [cog, setCog] = useState<string>('');
  const [showPresets, setShowPresets] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  // Stable callback references
  const handleNameChange = useCallback((text: string) => setName(text), []);
  const handleWidthChange = useCallback((text: string) => setWidth(text), []);
  const handleHeightChange = useCallback((text: string) => setHeight(text), []);
  const handleWeightChange = useCallback((text: string) => setWeight(text), []);

  // Special handler for length that doesn't trigger COG update during user input
  const handleLengthChange = useCallback((text: string) => {
    setLength(text);
  }, []);

  // Special handler for COG that prevents auto-updates when user is editing
  const handleCogChange = useCallback((text: string) => {
    setCog(text);
  }, []);

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

  // Update COG when length changes - but with debouncing to prevent loops
  useEffect(() => {
    const lengthValue = parseFloat(length || '0');
    if (lengthValue > 0 && cog === '') {
      // Only auto-set COG if it's empty
      setCog((lengthValue / 2).toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]); // Intentionally excluding 'cog' to prevent render loop

  // Memoized validation
  const isDataValid = useMemo(() => {
    return (
      name.trim() !== '' &&
      parseFloat(length || '0') > 0 &&
      parseFloat(width || '0') > 0 &&
      parseFloat(height || '0') > 0 &&
      parseFloat(weight || '0') > 0
    );
  }, [name, length, width, height, weight]);

  // Stable submit handler
  const handleSubmit = useCallback(() => {
    if (!isDataValid) return;

    const cogValue = parseFloat(cog || '0');
    const lengthValue = parseFloat(length);

    const itemToSave: CargoItem = {
      id: initialItem?.id || '',
      name,
      cargo_type_id: initialItem?.cargo_type_id || 1,
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      weight: parseFloat(weight),
      cog: cogValue > 0 ? cogValue : lengthValue / 2,
      fs: initialItem?.fs ?? 0,
      dock: initialItem?.dock ?? 'CoG',
      status: initialItem?.status || 'inventory',
      position: initialItem?.position || { x: -1, y: -1 },
    };

    onSave(itemToSave);
  }, [name, length, width, height, weight, cog, initialItem, isDataValid, onSave]);

  // Stable preset handlers
  const handleLoadPreset = useCallback((preset: CargoItem) => {
    setName(preset.name);
    setLength(preset.length.toString());
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
    setWeight(preset.weight.toString());
    setCog(preset.cog.toString());
    setShowPresets(false);
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
    setShowPresets(prev => !prev);
  }, [savedPresets.length]);

  // Stable preset item renderer
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

  // Stable slider handler
  const handleSliderChange = useCallback((value: number) => {
    setCog(value.toFixed(1));
  }, []);

  // Check if Windows platform
  const isWindows = Platform.OS === 'windows';
  const keyboardBehavior = isWindows ? 'padding' : (Platform.OS === 'ios' ? 'padding' : 'height');

  return (
    <Portal>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={keyboardBehavior}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View
            style={[
              styles.animatedModalContent,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
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
                {showPresets && savedPresets.length > 0 && (
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

              {/* Compact Form Layout */}
              <View style={styles.compactFormContainer}>
                {/* First Row: Name */}
                <View style={styles.formRow}>
                  <View style={styles.formFullWidth}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={handleNameChange}
                      placeholder="Item Name"
                    />
                  </View>
                </View>

                {/* Second Row: Dimensions and Weight */}
                <View style={styles.formRow}>
                  <FormField
                    label="Length (in)"
                    value={length}
                    onChangeText={handleLengthChange}
                    placeholder="Length"
                    keyboardType="numeric"
                  />
                  <FormField
                    label="Width (in)"
                    value={width}
                    onChangeText={handleWidthChange}
                    placeholder="Width"
                    keyboardType="numeric"
                  />
                  <FormField
                    label="Height (in)"
                    value={height}
                    onChangeText={handleHeightChange}
                    placeholder="Height"
                    keyboardType="numeric"
                  />
                  <FormField
                    label="Weight (lbs)"
                    value={weight}
                    onChangeText={handleWeightChange}
                    placeholder="Weight"
                    keyboardType="numeric"
                  />
                </View>

                {/* Fourth Row: Center of Gravity */}
                <View style={styles.formRow}>
                  <View style={styles.formFullWidth}>
                    <Text style={styles.label}>Center of Gravity (inches from front)</Text>
                    <View style={styles.cogContainer}>
                      <PlatformSlider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={parseFloat(length || '0') > 0 ? parseFloat(length) : 1}
                        step={0.1}
                        value={parseFloat(cog || '0')}
                        onValueChange={handleSliderChange}
                        minimumTrackTintColor="#0066cc"
                        maximumTrackTintColor="#d3d3d3"
                        thumbTintColor="#0066cc"
                        disabled={parseFloat(length || '0') <= 0}
                        showValue={false}
                      />
                      <TextInput
                        style={styles.cogInput}
                        value={cog}
                        onChangeText={handleCogChange}
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
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Portal>
  );
};

AddCargoItemModal.displayName = 'AddCargoItemModal';

export default AddCargoItemModal;
