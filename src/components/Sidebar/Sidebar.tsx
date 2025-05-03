import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Switch, Alert } from 'react-native';
import { CargoItem, Status, Position } from '../../types';
import SidebarItem from '../SidebarItem/SidebarItem';
import AddCargoItemModal from '../AddCargoItemModal/AddCargoItemModal';

type SortOption = 'none' | 'name' | 'weight' | 'dimensions' | 'status';

type SidebarProps = {
  items: CargoItem[];
  onAddItem: (item: CargoItem) => void;
  onEditItem: (item: CargoItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onUpdateItemStatus: (id: string, status: Status, position?: Position) => void;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateItemStatus,
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
    // Create a copy of the item to use as a preset (removing status and position)
    const presetItem = {
      ...item,
      id: `preset_${item.id}`,
      name: `${item.name} (Preset)`,
      status: 'inventory' as const,
      position: { x: -1, y: -1 },
    };

    // Check if a preset with similar dimensions already exists
    const presetExists = savedPresets.some(
      preset =>
        preset.length === item.length &&
        preset.width === item.width &&
        preset.height === item.height &&
        preset.weight === item.weight
    );

    if (!presetExists) {
      setSavedPresets(prev => [...prev, presetItem]);
      Alert.alert(
        'Preset Saved',
        `"${item.name}" has been saved as a preset and can be loaded when adding new items.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Similar Preset Exists',
        'A preset with similar dimensions already exists.',
        [{ text: 'OK' }]
      );
    }

    onSaveAsPreset(item);
  };

  return (
    <View style={[
      styles.sidebar,
      isTablet && styles.tabletSidebar,
      isLandscape && styles.landscapeSidebar,
    ]}>
      <View style={styles.sortContainer}>
        <View style={styles.sortHeader}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.switchRow}>
            <Switch
              style={styles.switchStyle}
              value={showLoadedItems}
              onValueChange={setShowLoadedItems}
              trackColor={{ false: '#b3b3b3', true: '#0066cc' }}
              thumbColor={showLoadedItems ? '#ffffff' : '#f4f3f4'}
            />
            <Text style={styles.toggleLabel}>Show loaded</Text>
          </View>
        </View>
        <View style={styles.sortControls}>
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
        </View>
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

const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderColor: '#ddd',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  tabletSidebar: {
    height: '100%',
  },
  landscapeSidebar: {
    width: 280,
    height: '100%',
    flex: 1,
  },
  sortContainer: {
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortSelect: {
    flex: 1,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbb',
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  sortSelectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
  },
  sortSelectText: {
    color: '#333',
    fontSize: 12,
    marginRight: 5,
  },
  sortSelectArrow: {
    fontSize: 8,
    color: '#555',
  },
  sortDirectionButton: {
    marginLeft: 6,
    padding: 0,
    height: 28,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  sortDirectionText: {
    fontSize: 12,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  toggleLabel: {
    fontSize: 11,
    color: '#484848',
    marginLeft: 1,
  },
  itemsList: {
    flex: 1,
    padding: 6,
  },
  emptyState: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    padding: 10,
    fontSize: 12,
  },
  addButtonContainer: {
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  switchStyle: {
    transform: [{ scaleX: 0.65 }, { scaleY: 0.65 }],
    marginRight: -5,
  },
});

export default Sidebar;
