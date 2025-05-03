import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CargoItem } from '../../types';

type SidebarItemProps = {
  item: CargoItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (item: CargoItem) => void;
  onAddToStage: (id: string) => void;
};

const SidebarItem = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onDragStart,
  onAddToStage,
}: SidebarItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartDrag = () => {
    onDragStart(item);
  };

  const handleAddToStage = () => {
    console.log(`SidebarItem: handleAddToStage called for item ${item.id}`);
    onAddToStage(item.id);
  };

  // Format dimensions for display - Use all three dimensions like reference
  const dimensions = `${item.length}\" x ${item.width}\" x ${item.height}\"`;

  // Show different styles or disable button based on item status
  const isInInventory = item.status === 'inventory';
  const addButtonStyle = isInInventory ? styles.addButton : [styles.addButton, styles.addButtonDisabled];
  const addButtonTextStyle = isInInventory ? styles.addButtonText : [styles.addButtonText, styles.addButtonTextDisabled];

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <TouchableOpacity style={styles.dragHandle} onPress={handleStartDrag}>
          <Text style={styles.iconText}>≡</Text>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDimensions}>{dimensions}</Text>
        </View>

        <TouchableOpacity 
          style={addButtonStyle}
          onPress={handleAddToStage}
          disabled={!isInInventory} // Disable if not in inventory
        >
          <Text style={addButtonTextStyle}>+</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dimensions:</Text>
            <Text style={styles.detailValue}>{dimensions}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{item.weight} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{item.status}</Text>
          </View>
          
          <View style={styles.expandedActions}>
            <TouchableOpacity 
              style={[styles.actionButtonLarge, styles.editButton]} 
              onPress={() => onEdit(item.id)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButtonLarge, styles.duplicateButton]} 
              onPress={() => onDuplicate(item.id)}
            >
              <Text style={styles.actionButtonText}>Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButtonLarge, styles.deleteButton]} 
              onPress={() => onDelete(item.id)}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <TouchableOpacity style={styles.expandToggle} onPress={toggleExpand}>
        <Text style={styles.expandToggleText}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDimensions: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dragHandle: {
    padding: 5,
  },
  addButton: {
    backgroundColor: '#4a90e2',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButtonTextDisabled: {
    color: '#999',
  },
  iconText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  expandToggle: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  expandToggleText: {
    fontSize: 10,
    color: '#888',
  },
  expandedDetails: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    width: 100,
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButtonLarge: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#0066cc',
  },
  duplicateButton: {
    backgroundColor: '#33cc33',
  },
  deleteButton: {
    backgroundColor: '#cc3333',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default SidebarItem;
