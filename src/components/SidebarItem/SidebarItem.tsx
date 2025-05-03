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

  // Format dimensions for display - Use all three dimensions like reference
  const dimensions = `${item.length}\" x ${item.width}\" x ${item.height}\"`;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <TouchableOpacity style={styles.iconButton} onPress={() => { /* TODO: Define action? Drag? */ }}>
          <Text style={styles.iconText}>...</Text>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDimensions}>{dimensions}</Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={handleAddToStage}>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Expanded details (Keep or remove depending on final design) */}
      {/* {isExpanded && ( ... )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    marginBottom: 3,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  itemHeader: { },
  itemInfo: {
    flexShrink: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  itemName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  itemDimensions: {
    fontSize: 9,
    color: '#888',
    marginTop: 0,
  },
  actions: { },

  plainActionButton: { },
  plainActionButtonText: { },
  styledActionButton: { },
  styledActionButtonText: { },
  actionButton: { },
  actionIcon: { },
  dragHandle: { },

  iconButton: {
    padding: 1,
  },
  iconText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
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
