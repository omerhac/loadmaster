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
    onAddToStage(item.id);
  };

  // Format dimensions for display
  const dimensions = `${item.length}x${item.width} | ${item.weight}kg`;

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.itemHeader} onPress={toggleExpand}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDimensions}>{dimensions}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(item.id)}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDuplicate(item.id)}
          >
            <Text style={styles.actionIcon}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dragHandle}
            onPressIn={handleStartDrag}
          >
            <Text style={styles.actionIcon}>↔️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddToStage}
          >
            <Text style={styles.actionIcon}>➕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dimensions:</Text>
            <Text style={styles.detailValue}>{item.length}" x {item.width}" x {item.height}"</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{item.weight} lbs</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Center of Gravity:</Text>
            <Text style={styles.detailValue}>{item.cog} inches</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemDimensions: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  dragHandle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
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
    width: 120,
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
  },
});

export default SidebarItem;
