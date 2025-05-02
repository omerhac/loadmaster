import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CargoItem, Position } from '../../types';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

type DeckProps = {
  items: CargoItem[];
  onDrop: (id: string, position: Position) => void;
};

const DeckItem = ({ item }: { item: CargoItem }) => {
  const translateX = useSharedValue(item.position.x);
  const translateY = useSharedValue(item.position.y);
  const scale = useSharedValue(1);

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.1);
    },
    onActive: (event) => {
      translateX.value = event.translationX + item.position.x;
      translateY.value = event.translationY + item.position.y;
    },
    onEnd: () => {
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent}>
      <Animated.View
        style={[
          styles.cargoItem,
          {
            width: item.width,
            height: item.length,
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.itemName}>{item.name}</Text>
      </Animated.View>
    </PanGestureHandler>
  );
};

const Deck = ({ items, onDrop }: DeckProps) => {
  const deckItems = items.filter((item) => item.status === 'onDeck');

  return (
    <View style={styles.deckContainer}>
      <Text style={styles.deckTitle}>Cargo Deck</Text>
      <View style={styles.deck}>
        {deckItems.map((item) => (
          <DeckItem key={item.id} item={item} />
        ))}
        {deckItems.length === 0 && (
          <Text style={styles.emptyMessage}>Drag items here to load</Text>
        )}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  deckContainer: {
    flex: 2,
    padding: 10,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  deck: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cargoItem: {
    position: 'absolute',
    backgroundColor: '#4a90e2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemName: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
  },
});

export default Deck; 