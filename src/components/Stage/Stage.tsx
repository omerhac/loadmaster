import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CargoItem } from '../../types';

type StageProps = {
  items: CargoItem[];
  onRemoveFromStage: (id: string) => void;
  onAddToStage: (id: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Stage = ({ items, onRemoveFromStage, onAddToStage }: StageProps) => {
  const stageItems = items.filter(item => item.status === 'onStage');

  return (
    <View style={styles.stageContainer}>
      <View style={styles.stageHeader}>
        <Text style={styles.stageTitle}>Staging Area</Text>
      </View>

      <ScrollView style={styles.itemsContainer}>
        {stageItems.map(item => (
          <View key={item.id} style={styles.stageItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                {item.length}x{item.width} | {item.weight}kg
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveFromStage(item.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {stageItems.length === 0 && (
          <Text style={styles.emptyMessage}>
            No items in staging area
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stageContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemsContainer: {
    flex: 1,
    padding: 10,
  },
  stageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 4,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default Stage;
