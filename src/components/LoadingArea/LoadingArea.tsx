import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CargoItem } from '../../types';
import Deck from '../Deck/Deck';
import Stage from '../Stage/Stage';

type LoadingAreaProps = {
  items: CargoItem[];
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position?: { x: number, y: number }) => void;
};

const LoadingArea = ({ items, onUpdateItemStatus }: LoadingAreaProps) => {
  return (
    <View style={styles.loadingArea}>
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
});

export default LoadingArea;
