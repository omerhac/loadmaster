import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { CargoItem } from '../../types';
import Deck from '../Deck/Deck';
import Stage from '../Stage/Stage';

type LoadingAreaProps = {
  items: CargoItem[];
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position?: { x: number, y: number }) => void;
};

const LoadingArea = ({ items, onUpdateItemStatus }: LoadingAreaProps) => {
  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  // Count items in stage
  const stageItems = items.filter(item => item.status === 'onStage');
  const stageItemCount = stageItems.length;

  return (
    <View style={[
      styles.loadingArea,
      isTablet && styles.tabletLoadingArea,
      isLandscape && styles.landscapeLoadingArea
    ]}>
      <Deck
        items={items}
        onDrop={(id, position) => onUpdateItemStatus(id, 'onDeck', position)}
      />
      
      <View style={styles.stageAreaContainer}>
        <View style={styles.stageHeader}>
          <Text style={styles.stageTitle}>Stage Area</Text>
          <View style={styles.stageActions}>
            <TouchableOpacity 
              style={styles.stageItemCountButton}
              onPress={() => console.log('Items count clicked')}
            >
              <Text style={styles.stageItemCount}>{stageItemCount} items</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Stage
          items={items}
          onRemoveFromStage={(id) => onUpdateItemStatus(id, 'inventory')}
          onAddToStage={(id) => onUpdateItemStatus(id, 'onStage')}
        />
        
        <TouchableOpacity 
          style={styles.addToStageButton}
          onPress={() => {
            // Find first inventory item and add it to stage
            const inventoryItem = items.find(item => item.status === 'inventory');
            if (inventoryItem) {
              onUpdateItemStatus(inventoryItem.id, 'onStage');
            }
          }}
        >
          <Text style={styles.addToStageButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  tabletLoadingArea: {
    padding: 0,
  },
  landscapeLoadingArea: {
    flex: 3,
  },
  stageAreaContainer: {
    display: 'flex',
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 10,
    position: 'relative',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageItemCountButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  stageItemCount: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  addToStageButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
  },
  addToStageButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 36,
  },
});

export default LoadingArea;
