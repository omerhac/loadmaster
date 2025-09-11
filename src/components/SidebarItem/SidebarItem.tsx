import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
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
  onShowDropdown: (item: CargoItem, position: { x: number; y: number }) => void;
};

const SidebarItem = ({
  item,
  onEdit: _onEdit,
  onDelete: _onDelete,
  onDuplicate: _onDuplicate,
  onSaveAsPreset: _onSaveAsPreset,
  onAddToStage,
  onRemoveFromStage,
  onShowDropdown,
}: SidebarItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuButtonRef = useRef<View>(null);

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

  const handleMenuPress = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenHeight = Dimensions.get('window').height;
        const dropdownHeight = 4 * 32; // Approximate height: 4 items * 32px each
        const spaceBelow = screenHeight - pageY;

        // If there's not enough space below, position dropdown higher
        let adjustedY = pageY - 45;
        if (spaceBelow < dropdownHeight + 50) {
          // Move it further up if we're near the bottom
          adjustedY = pageY - dropdownHeight - 10;
        }

        onShowDropdown(item, { x: pageX + width, y: adjustedY });
      });
    }
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
          ref={menuButtonRef}
          style={styles.menuButton}
          onPress={handleMenuPress}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.itemDimensions}>
              {item.weight}lb | <Text style={styles.fsText}>{item.fs > 0 ? item.fs : 'not set'}</Text>
            </Text>
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
            <Text style={styles.detailLabel}>CG:</Text>
            <Text style={styles.detailValue}>{item.cog}"</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dim:</Text>
            <Text style={styles.detailValue}>{dimensions}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SidebarItem;
