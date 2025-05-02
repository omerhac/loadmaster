import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Switch } from 'react-native';
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
};

const Sidebar = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onUpdateItemStatus,
}: SidebarProps) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [draggingItem, setDraggingItem] = useState<CargoItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showLoadedItems, setShowLoadedItems] = useState(true);

  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width } = Dimensions.get('window');
  const isLandscape = width > Dimensions.get('window').height;

  // Filter and sort items for display
  const filteredItems = items.filter(item =>
    showLoadedItems || item.status === 'inventory'
  );

  const handleAddItem = () => {
    setEditingItem(null);
    setIsAddModalVisible(true);
  };

  const handleEditItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setEditingItem(item);
      setIsAddModalVisible(true);
    }
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

  const handleDragStart = (item: CargoItem) => {
    setDraggingItem(item);
  };

  // Add to staging area by updating item status to 'onStage'
  const handleAddToStage = (id: string) => {
    onUpdateItemStatus(id, 'onStage');
  };

  return (
    <View style={[
      styles.sidebar,
      isTablet && styles.tabletSidebar,
      isLandscape && styles.landscapeSidebar,
    ]}>
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
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
            <Text style={styles.sortSelectText}>
              {sortBy === 'none' ? 'Sort by...' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleContainer}>
          <Switch
            value={showLoadedItems}
            onValueChange={setShowLoadedItems}
            trackColor={{ false: '#b3b3b3', true: '#0066cc' }}
            thumbColor={showLoadedItems ? '#ffffff' : '#f4f3f4'}
          />
          <Text style={styles.toggleLabel}>Show loaded items</Text>
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
            onDragStart={handleDragStart}
            onAddToStage={handleAddToStage}
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
          <Text style={styles.addButtonText}>Add Cargo Item</Text>
          <Text style={styles.addButtonIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {isAddModalVisible && (
        <AddCargoItemModal
          initialItem={editingItem || undefined}
          onSave={handleSaveItem}
          onCancel={() => setIsAddModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
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
    width: 260,
    height: '100%',
    flex: 1,
  },
  sortContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortSelect: {
    flex: 1,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  sortSelectText: {
    color: '#484848',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  toggleLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#484848',
  },
  itemsList: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  emptyState: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    padding: 15,
  },
  addButtonContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default Sidebar;
