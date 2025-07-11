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
import Slider from '@react-native-community/slider';
import { CargoItem } from '../../types';
import { styles } from './AddCargoItemModal.styles';
import { Portal } from 'react-native-portalize';

interface AddCargoItemModalProps {
  initialItem?: CargoItem;
  onSave: (item: CargoItem) => void;
  onCancel: () => void;
  savedPresets?: CargoItem[];
}

const AddCargoItemModal: React.FC<AddCargoItemModalProps> = React.memo(({
  initialItem,
  onSave,
  onCancel,
  savedPresets = [],
}) => {
  const [name, setName] = useState('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [cog, setCog] = useState<string>('');
  const [showPresets, setShowPresets] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

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

  // Update COG when length changes
  useEffect(() => {
    const lengthValue = parseFloat(length || '0');
    if (lengthValue > 0) {
      setCog((lengthValue / 2).toFixed(1));
    }
  }, [length]);

  // Check if form data is valid
  const isDataValid = useMemo(() => {
    return (
      name.trim() !== '' &&
      parseFloat(length || '0') > 0 &&
      parseFloat(width || '0') > 0 &&
      parseFloat(height || '0') > 0 &&
      parseFloat(weight || '0') > 0
    );
  }, [name, length, width, height, weight]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!isDataValid) {return;}

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
      cog: cogValue > 0 ? cogValue : lengthValue / 2, // Default to half length if not set
      fs: initialItem?.fs ?? 0, // keep previous FS, but not editable here
      dock: initialItem?.dock ?? 'CoG',
      status: initialItem?.status || 'inventory',
      position: initialItem?.position || { x: -1, y: -1 },
    };

    onSave(itemToSave);
  }, [name, length, width, height, weight, cog, initialItem, isDataValid, onSave]);

  // Handle loading a preset
  const handleLoadPreset = useCallback((preset: CargoItem) => {
    setName(preset.name);
    setLength(preset.length.toString());
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
    setWeight(preset.weight.toString());
    setCog(preset.cog.toString());
    setShowPresets(false);
  }, []);

  // Toggle preset dropdown visibility
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

  // Render a preset item
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

  return (
    <Portal>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View
            style={[
              styles.animatedModalContent,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
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
                      onChangeText={setName}
                      placeholder="Item Name"
                    />
                  </View>
                </View>
                {/* Second Row: Dimensions and Weight */}
                <View style={styles.formRow}>
                  <View style={styles.formColumnBetter}><Text style={styles.label}>Length (in)</Text><TextInput style={styles.input} value={length} onChangeText={setLength} keyboardType="numeric" placeholder="Length" /></View>
                  <View style={styles.formColumnBetter}><Text style={styles.label}>Width (in)</Text><TextInput style={styles.input} value={width} onChangeText={setWidth} keyboardType="numeric" placeholder="Width" /></View>
                  <View style={styles.formColumnBetter}><Text style={styles.label}>Height (in)</Text><TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="Height" /></View>
                  <View style={styles.formColumnBetter}><Text style={styles.label}>Weight (lbs)</Text><TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Weight" /></View>
                </View>
                {/* Fourth Row: Center of Gravity */}
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
});

AddCargoItemModal.displayName = 'AddCargoItemModal';

export default AddCargoItemModal;
