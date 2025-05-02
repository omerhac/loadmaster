import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CargoItem } from '../../types';

type SidebarItemProps = {
  item: CargoItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (item: CargoItem) => void;
};

const SidebarItem = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onDragStart,
}: SidebarItemProps) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={() => onDragStart(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.details}>
          {item.length}x{item.width} | {item.weight}kg
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(item.id)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDuplicate(item.id)}
        >
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'column',
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 12,
    padding: 5,
  },
  actionText: {
    color: '#0066cc',
    fontSize: 14,
  },
});

export default SidebarItem;
