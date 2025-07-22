import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, Alert } from 'react-native';
import { CargoItem } from '../../types';
import SidebarItem from '../SidebarItem/SidebarItem';
import { styles } from './Sidebar.styles';

type SidebarProps = {
  items: CargoItem[];
  onAddItem: () => void;
  onEditItem: (item: CargoItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onSaveAsPreset: (item: CargoItem) => void;
  onAddToStage: (id: string) => void;
  onRemoveFromStage: (id: string) => void;
};

const Sidebar = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onSaveAsPreset,
  onAddToStage,
  onRemoveFromStage,
}: SidebarProps) => {
  const [showLoadedItems, setShowLoadedItems] = useState(true);

  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width } = Dimensions.get('window');
  const isLandscape = width > Dimensions.get('window').height;

  // Sort and filter items
  const sortAndFilterItems = useCallback(() => {
    let filtered = items.filter(item =>
      showLoadedItems || item.status === 'inventory'
    );
    return filtered;
  }, [items, showLoadedItems]);

  const filteredItems = sortAndFilterItems();

  // Handle save as preset
  const handleSaveAsPreset = (item: CargoItem) => {
    const presetItem = {
      ...item,
      name: `${item.name} (Preset)`,
      status: 'inventory' as const,
      position: { x: -1, y: -1 },
    };

    Alert.alert(
      'Preset Saved',
      `"${item.name}" has been saved as a preset and can be loaded when adding new items.`,
      [{ text: 'OK' }]
    );

    onSaveAsPreset(presetItem);
  };

  const containerStyle = [
    styles.sidebar,
    isTablet && styles.tabletSidebar,
    isLandscape && styles.landscapeSidebar,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.sortContainer}>
        <View style={styles.sortHeader}>
          <Text style={styles.sortLabel}>Show loaded:</Text>
          <TouchableOpacity
            style={[styles.sortSelect, !showLoadedItems && styles.sortSelectOff]}
            onPress={() => setShowLoadedItems(!showLoadedItems)}
          >
            <Text style={styles.sortSelectText}>
              {showLoadedItems ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.itemsList}>
        {filteredItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onDuplicate={onDuplicateItem}
            onSaveAsPreset={handleSaveAsPreset}
            onAddToStage={onAddToStage}
            onRemoveFromStage={onRemoveFromStage}
          />
        ))}
        {filteredItems.length === 0 && (
          <Text style={styles.emptyState}>No items in inventory</Text>
        )}
      </ScrollView>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddItem}
        >
          <Text style={styles.addButtonText}>Add Item+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Sidebar;
