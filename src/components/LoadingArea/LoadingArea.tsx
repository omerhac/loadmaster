import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
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

  return (
    <View style={[
      styles.loadingArea,
      isIpad && styles.ipadLoadingArea,
      isWindows && styles.windowsLoadingArea,
      isTablet && styles.tabletLoadingArea,
      isLandscape && styles.landscapeLoadingArea
    ]}>
      <Deck
        items={items}
        onDrop={(id, position) => onUpdateItemStatus(id, 'onDeck', position)}
      />
      <Stage
        items={items}
        onRemoveFromStage={(id) => onUpdateItemStatus(id, 'inventory')}
        onAddToStage={(id) => onUpdateItemStatus(id, 'onStage')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  ipadLoadingArea: {
    padding: 12,
  },
  windowsLoadingArea: {
    padding: 10,
    backgroundColor: '#f8f8f8', // Lighter gray for Windows
  },
  tabletLoadingArea: {
    padding: 10,
  },
  landscapeLoadingArea: {
    flex: 3,
    flexDirection: 'column',
  },
});

export default LoadingArea;
