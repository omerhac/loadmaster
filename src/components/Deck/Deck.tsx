import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, PanResponder, Animated, TouchableOpacity } from 'react-native';
import { CargoItem, Position } from '../../types';
import { Images } from '../../assets';

type DeckProps = {
  items: CargoItem[];
  onDrop: (id: string, position: Position) => void;
  onRemoveFromDeck?: (id: string) => void;
};

type DeckItemProps = {
  item: CargoItem;
  onRemove?: (id: string) => void;
};

const DeckItem = ({ item, onRemove }: DeckItemProps) => {
  // Track selected state for deletion
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Create animated values for dragging items on the deck
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Allow dragging items that are already on the deck
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Store the current position as an offset
        translateX.extractOffset();
        translateY.extractOffset();

        // Show visual feedback
        setIsDragging(true);
        Animated.spring(scale, {
          toValue: 1.05,
          friction: 5,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        // Flatten offset to lock in the new position
        translateX.flattenOffset();
        translateY.flattenOffset();

        // Return to normal size
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        setIsDragging(false);
      },
    })
  ).current;

  const handleRemove = () => {
    if (onRemove) {
      onRemove(item.id);
    }
    setIsSelected(false);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cargoItem,
        {
          width: item.width,
          height: item.length,
          left: item.position.x,
          top: item.position.y,
          transform: [
            { translateX: translateX },
            { translateY: translateY },
            { scale: scale },
          ],
        },
        isSelected && styles.selectedItem,
        isDragging && styles.draggingItem,
      ]}
    >
      <TouchableOpacity
        style={styles.itemContentContainer}
        onPress={() => !isDragging && setIsSelected(!isSelected)}
        activeOpacity={0.8}
        disabled={isDragging}
      >
        <Text style={styles.itemName}>{item.name}</Text>
        {isSelected && !isDragging && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Deck = ({ items, onDrop, onRemoveFromDeck }: DeckProps) => {
  const deckItems = items.filter((item) => item.status === 'onDeck');

  return (
    <View style={styles.deckContainer}>
      <ImageBackground
        source={Images.deck}
        style={styles.deck}
        resizeMode="cover"
      >
        {deckItems.map((item) => (
          <DeckItem
            key={item.id}
            item={item}
            onRemove={onRemoveFromDeck}
          />
        ))}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    flex: 2,
    padding: 10,
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
    zIndex: 1,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
    zIndex: 2,
  },
  draggingItem: {
    opacity: 0.8,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 999,
  },
  itemName: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
  },
  itemContentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff6b6b',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Deck;
