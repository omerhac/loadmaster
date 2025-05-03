import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CargoItem } from '../../types';

type SidebarItemProps = {
  item: CargoItem;
  onEdit: (item: CargoItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSaveAsPreset: (item: CargoItem) => void;
  onAddToStage: (id: string) => void;
  onRemoveFromStage: (id: string) => void;
};

const SidebarItem = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onSaveAsPreset,
  onAddToStage,
  onRemoveFromStage,
}: SidebarItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddToStage = () => {
    if (item.status === 'inventory') {
      onAddToStage(item.id);
    } else {
      onRemoveFromStage(item.id);
    }
  };

  const showActionsMenu = () => {
    Alert.alert(
      'Item Actions',
      'Choose an action:',
      [
        { text: 'Edit item', onPress: () => onEdit(item) },
        { text: 'Duplicate item', onPress: () => onDuplicate(item.id) },
        { text: 'Save as preset', onPress: () => onSaveAsPreset(item) },
        { text: 'Delete item', style: 'destructive', onPress: () => onDelete(item.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Format dimensions for display
  const dimensions = `${item.length}"×${item.width}"×${item.height}"`;
  
  // Format weight for display
  const weight = `${item.weight}lb`;

  // Determine if item is in inventory
  const isInInventory = item.status === 'inventory';

  return (
    <View style={[styles.itemContainer, isInInventory ? styles.inInventory : styles.onStage]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleExpand}
        style={styles.itemHeader}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={showActionsMenu}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          
          {!isExpanded ? (
            <View style={styles.compactInfo}>
              <Text style={styles.itemDimensions}>{dimensions}</Text>
              <Text style={styles.itemWeight}>{weight}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddToStage}
          hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
        >
          {isInInventory ? (
            <Text style={styles.actionButtonText}>+</Text>
          ) : (
            <Text style={styles.actionButtonRemoveText}>×</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dim:</Text>
            <Text style={styles.detailValue}>{dimensions}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{item.weight} lbs</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CoG:</Text>
            <Text style={styles.detailValue}>{item.cog}"</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  inInventory: {
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  onStage: {
    borderLeftWidth: 3,
    borderLeftColor: '#4fc08d',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  menuButton: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 4,
  },
  compactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  itemDimensions: {
    fontSize: 10,
    color: '#666',
  },
  itemWeight: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  actionButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  actionButtonRemoveText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  itemDetails: {
    padding: 5,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 10,
    color: '#555',
    width: 45,
  },
  detailValue: {
    fontSize: 10,
    color: '#333',
    flex: 1,
  },
});

export default SidebarItem;
