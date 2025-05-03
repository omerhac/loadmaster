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
  const dimensions = `${item.length}" x ${item.width}" x ${item.height}"`;

  // Determine if item is in inventory
  const isInInventory = item.status === 'inventory';

  return (
    <View style={[styles.itemContainer, isInInventory ? styles.inInventory : null]}>
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
        
        <View style={styles.itemNameContainer}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {!isExpanded && (
            <Text style={styles.itemDimensions} numberOfLines={1}>{dimensions}</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleAddToStage}
          hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
        >
          <Text style={styles.actionButtonText}>
            {isInInventory ? '+' : '−'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dimensions: </Text>
            <Text style={styles.detailValue}>{dimensions}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight: </Text>
            <Text style={styles.detailValue}>{item.weight} lbs</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Center of Gravity: </Text>
            <Text style={styles.detailValue}>{item.cog} inches</Text>
          </View>
        </View>
      )}
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
  inInventory: {
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  itemNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDimensions: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  itemDetails: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 12,
    color: '#555',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
});

export default SidebarItem;
