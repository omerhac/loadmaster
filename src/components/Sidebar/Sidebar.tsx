import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
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
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemsList}>
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
          <Text style={styles.emptyState}>No items in inventory</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default Sidebar;
