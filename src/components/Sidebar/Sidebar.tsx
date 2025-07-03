import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, Switch, Alert } from 'react-native';
import { CargoItem } from '../../types';
import SidebarItem from '../SidebarItem/SidebarItem';
import AddCargoItemModal from '../AddCargoItemModal/AddCargoItemModal';
import { styles } from './Sidebar.styles';
import { getAllCargoTypes } from '../../services/db/operations/CargoTypeOperations';
import { CargoType as DbCargoType } from '../../services/db/operations/types';

type SortOption = 'none' | 'name' | 'weight' | 'dimensions' | 'status';

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

function convertDbCargoTypeToCargoItem(dbCargoType: DbCargoType): CargoItem {
  const cog = dbCargoType.default_cog || 0;
  return {
    id: generateId(),
    name: dbCargoType.name,
    weight: dbCargoType.default_weight,
    length: dbCargoType.default_length,
    width: dbCargoType.default_width,
    height: dbCargoType.default_height,
    cargo_type_id: dbCargoType.id || 1,
    status: 'inventory',
    cog,
    fs: 0, // Default to 0 for inventory items
    position: { x: -1, y: -1 },
  };
}

type SidebarProps = {
  items: CargoItem[];
  onAddItem: (item: CargoItem) => void;
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
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItem | null>(null);
  const [savedPresets, setSavedPresets] = useState<CargoItem[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showLoadedItems, setShowLoadedItems] = useState(true);
  const [reverseSort, setReverseSort] = useState(false);

  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width } = Dimensions.get('window');
  const isLandscape = width > Dimensions.get('window').height;

  useEffect(() => {
    const fetchCargoTypes = async () => {
      const dbCargoTypes = (await getAllCargoTypes()).results.map(item => item.data) as DbCargoType[];
      const cargoItems = dbCargoTypes.map(convertDbCargoTypeToCargoItem);
      setSavedPresets(cargoItems);
    };
    fetchCargoTypes();
  }, []);

  // Sort and filter items
  const sortAndFilterItems = useCallback(() => {
    let filtered = items.filter(item =>
      showLoadedItems || item.status === 'inventory'
    );

    // Sort items based on selected criterion
    if (sortBy !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'weight':
            return a.weight - b.weight;
          case 'dimensions':
            const aVolume = a.length * a.width * a.height;
            const bVolume = b.length * b.width * b.height;
            return aVolume - bVolume;
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });

      // Reverse the sort order if needed
      if (reverseSort) {
        filtered.reverse();
      }
    }

    return filtered;
  }, [items, sortBy, showLoadedItems, reverseSort]);

  const filteredItems = sortAndFilterItems();

  const handleAddItem = () => {
    setEditingItem(null);
    setIsAddModalVisible(true);
  };

  const handleEditItem = (item: CargoItem) => {
    setEditingItem(item);
    setIsAddModalVisible(true);
  };

  const handleSaveItem = (item: CargoItem) => {
    if (editingItem) {
      onEditItem(item);
    } else {
      onAddItem(item);
    }
    setIsAddModalVisible(false);
    setEditingItem(null);
  };

  // Update saved presets when requested
  const handleSaveAsPreset = (item: CargoItem) => {
    const presetItem = {
      ...item,
      name: `${item.name} (Preset)`,
      status: 'inventory' as const,
      position: { x: -1, y: -1 },
    };

    setSavedPresets(prev => [...prev, presetItem]);
    Alert.alert(
      'Preset Saved',
      `"${item.name}" has been saved as a preset and can be loaded when adding new items.`,
      [{ text: 'OK' }]
    );

    onSaveAsPreset(presetItem);
  };

  return (
    <View style={[
      styles.sidebar,
      isTablet && styles.tabletSidebar,
      isLandscape && styles.landscapeSidebar,
    ]}>
      <View style={styles.sortContainer}>
        <View style={styles.sortHeader}>
          <Text style={styles.sortLabel}>Show loaded:</Text>
          <View style={styles.switchRow}>
            <Switch
              style={styles.switchStyle}
              value={showLoadedItems}
              onValueChange={setShowLoadedItems}
              trackColor={{ false: '#b3b3b3', true: '#0066cc' }}
              thumbColor={showLoadedItems ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
        {/* <View style={styles.sortControls}>
          <TouchableOpacity
            style={styles.sortSelect}
            onPress={() => {
              // Cycle through sort options
              const options: SortOption[] = ['none', 'name', 'weight', 'dimensions', 'status'];
              const currentIndex = options.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % options.length;
              setSortBy(options[nextIndex]);
            }}
          >
            <View style={styles.sortSelectInner}>
              <Text style={styles.sortSelectText} numberOfLines={1}>
                {sortBy === 'none' ? 'Sort by...' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Text>
              <Text style={styles.sortSelectArrow}>▼</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortDirectionButton}
            onPress={() => setReverseSort(!reverseSort)}
          >
            <Text style={styles.sortDirectionText}>{reverseSort ? '↑' : '↓'}</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      <ScrollView style={styles.itemsList}>
        {filteredItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            onEdit={handleEditItem}
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
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>Add Item+</Text>
        </TouchableOpacity>
      </View>

      {isAddModalVisible && (
        <AddCargoItemModal
          initialItem={editingItem || undefined}
          onSave={handleSaveItem}
          onCancel={() => setIsAddModalVisible(false)}
          savedPresets={savedPresets}
        />
      )}
    </View>
  );
};

export default Sidebar;
