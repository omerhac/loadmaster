import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './SidebarItem.styles';

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
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={isInInventory ? styles.actionButton : styles.actionButtonRemove}
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

export default SidebarItem;
