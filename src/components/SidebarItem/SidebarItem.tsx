import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Modal } from 'react-native';
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
  const [showDropdown, setShowDropdown] = useState(false);

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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMenuAction = (action: () => void) => {
    setShowDropdown(false);
    action();
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
          onPress={toggleDropdown}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.itemDimensions}>{dimensions}</Text>
          </View>
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
            <Text style={styles.detailLabel}>FS:</Text>
            <Text style={styles.detailValue}>{item.fs > 0 ? item.fs : 'not set'}</Text>
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

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
        supportedOrientations={['portrait', 'landscape']}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalDropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleMenuAction(() => onEdit(item))}
              >
                <Text style={styles.dropdownItemText}>Edit item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleMenuAction(() => onDuplicate(item.id))}
              >
                <Text style={styles.dropdownItemText}>Duplicate item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleMenuAction(() => onSaveAsPreset(item))}
              >
                <Text style={styles.dropdownItemText}>Save as preset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemDanger]}
                onPress={() => handleMenuAction(() => onDelete(item.id))}
              >
                <Text style={[styles.dropdownItemText, styles.dropdownItemDangerText]}>Delete item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default SidebarItem;
