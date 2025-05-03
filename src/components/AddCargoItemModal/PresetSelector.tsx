import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './AddCargoItemModal.styles';

interface PresetSelectorProps {
  savedPresets: CargoItem[];
  onSelectPreset: (preset: CargoItem) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = React.memo(({
  savedPresets,
  onSelectPreset
}) => {
  const [showPresets, setShowPresets] = useState(false);

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

  const handleSelectPreset = useCallback((preset: CargoItem) => {
    onSelectPreset(preset);
    setShowPresets(false);
  }, [onSelectPreset]);

  const renderPresetItem = useCallback(({ item }: { item: CargoItem }) => (
    <TouchableOpacity
      style={styles.presetItem}
      onPress={() => handleSelectPreset(item)}
    >
      <Text style={styles.presetItemName}>{item.name}</Text>
      <Text style={styles.presetItemDimensions}>
        {`${item.length}" x ${item.width}" x ${item.height}"`}
      </Text>
    </TouchableOpacity>
  ), [handleSelectPreset]);

  return (
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
  );
});

PresetSelector.displayName = 'PresetSelector';

export default PresetSelector; 