import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, Dimensions } from 'react-native';
import { CargoItem, Status, Position } from '../../types';
import SidebarItem from '../SidebarItem/SidebarItem';
import AddCargoItemModal from '../AddCargoItemModal/AddCargoItemModal';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateItemStatus,
}: SidebarProps) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [draggingItem, setDraggingItem] = useState<CargoItem | null>(null);
  
  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width } = Dimensions.get('window');
  const isLandscape = width > Dimensions.get('window').height;

  const inventoryItems = items.filter(item => item.status === 'inventory');

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

  return (
    <View style={[
      styles.sidebar, 
      isIpad && styles.ipadSidebar,
      isWindows && styles.windowsSidebar,
      isTablet && styles.tabletSidebar,
      isLandscape && styles.landscapeSidebar
    ]}>
      <View style={[
        styles.header, 
        isIpad && styles.ipadHeader,
        isWindows && styles.windowsHeader,
        isTablet && styles.tabletHeader
      ]}>
        <Text style={[
          styles.title, 
          isIpad && styles.ipadTitle,
          isWindows && styles.windowsTitle,
          isTablet && styles.tabletTitle
        ]}>Inventory</Text>
        <TouchableOpacity
          style={[
            styles.addButton, 
            isIpad && styles.ipadAddButton,
            isWindows && styles.windowsAddButton,
            isTablet && styles.tabletAddButton
          ]}
          onPress={handleAddItem}
        >
          <Text style={[
            styles.addButtonText, 
            isIpad && styles.ipadButtonText,
            isWindows && styles.windowsButtonText,
            isTablet && styles.tabletButtonText
          ]}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.itemsList, isWindows && styles.windowsItemsList]}>
        {inventoryItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            onEdit={handleEditItem}
            onDelete={onDeleteItem}
            onDuplicate={onDuplicateItem}
            onDragStart={handleDragStart}
          />
        ))}
        {inventoryItems.length === 0 && (
          <Text style={[styles.emptyState, isWindows && styles.windowsEmptyState]}>No items in inventory</Text>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <AddCargoItemModal
          initialItem={editingItem || undefined}
          onSave={handleSaveItem}
          onCancel={() => setIsAddModalVisible(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  ipadSidebar: {
    height: 'auto',
    maxHeight: 'auto',
  },
  windowsSidebar: {
    height: 'auto',
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#d0d0d0',
  },
  tabletSidebar: {
    height: 'auto',
  },
  landscapeSidebar: {
    width: 320,
    height: '100%',
    borderRightWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  ipadHeader: {
    padding: 20,
  },
  windowsHeader: {
    padding: 16,
    borderBottomColor: '#e0e0e0',
  },
  tabletHeader: {
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  ipadTitle: {
    fontSize: 22,
  },
  windowsTitle: {
    fontSize: 20,
    fontFamily: Platform.OS === 'windows' ? 'Segoe UI' : undefined,
    fontWeight: '500',
  },
  tabletTitle: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipadAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  windowsAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 2,
    backgroundColor: '#0078d4', // Windows blue
  },
  tabletAddButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  ipadButtonText: {
    fontSize: 16,
  },
  windowsButtonText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'windows' ? 'Segoe UI' : undefined,
    fontWeight: '400',
  },
  tabletButtonText: {
    fontSize: 15,
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  windowsItemsList: {
    padding: 14,
  },
  emptyState: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
  windowsEmptyState: {
    fontFamily: Platform.OS === 'windows' ? 'Segoe UI' : undefined,
    color: '#777',
  },
});

export default Sidebar;
