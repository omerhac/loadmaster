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
      isLandscape && styles.landscapeLoadingArea,
    ]}>
      <Deck
        items={items}
        onDrop={(id, position) => onUpdateItemStatus(id, 'onDeck', position)}
      />

      <View style={styles.stageAreaContainer}>
        <View style={styles.stageHeader}>
          <Text style={styles.stageTitle} accessibilityRole="header">Stage Area</Text>
          <View style={styles.stageActions}>
            <Text style={styles.stageItemCount} accessibilityRole="header">{stageItemCount} items</Text>
          </View>
        </View>

        <Stage
          items={items}
          onRemoveFromStage={(id) => onUpdateItemStatus(id, 'inventory')}
          onAddToStage={(id) => onUpdateItemStatus(id, 'onStage')}
        />
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
    flex: 1,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  stageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageItemCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
});

export default LoadingArea;
