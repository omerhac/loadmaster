import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { CargoItem } from '../../types';

type StageProps = {
  items: CargoItem[];
  onRemoveFromStage: (id: string) => void;
  onAddToStage: (id: string) => void;
  onDragToDeck: (id: string, position: { x: number, y: number }) => void;
};

const StageItem = ({
  item,
  onRemove,
  onDragToDeck,
}: {
  item: CargoItem;
  onRemove: (id: string) => void;
  onDragToDeck: (id: string, position: { x: number, y: number }) => void;
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger on significant movement to avoid accidental drags
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Only trigger on significant movement to avoid accidental drags
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Show visual feedback when dragging starts
        setIsDragging(true);

        // Store the current value as an offset to avoid jumping
        translateX.extractOffset();
        translateY.extractOffset();

        // Animate the item to look "picked up"
        Animated.spring(scale, {
          toValue: 1.1,
          friction: 5,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (event, gestureState) => {
        // Clear offsets
        translateX.flattenOffset();
        translateY.flattenOffset();

        // Determine if the item was dragged far enough to be considered a "drop on deck"
        if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
          // Get the absolute screen position where the item was dropped
          const dropX = event.nativeEvent.pageX;
          const dropY = event.nativeEvent.pageY;

          const deckPosition = {
            x: dropX,
            y: dropY,
          };

          // Move to deck with exact position
          onDragToDeck(item.id, deckPosition);
        } else {
          // Not dragged far enough, return to original position with animation
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true,
            }),
          ]).start();
        }

        setIsDragging(false);
      },
      // Ensure dragging is canceled properly if interrupted
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        translateY.flattenOffset();

        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();

        setIsDragging(false);
      },
    })
  ).current;

  const handleRemove = () => {
    onRemove(item.id);
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
        onPress={() => setIsSelected(!isSelected)}
        activeOpacity={0.8}
        disabled={isDragging}
      >
        <Text style={styles.itemName}>{item.name}</Text>
        {isSelected && !isDragging && (
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
const Stage = ({ items, onRemoveFromStage, onAddToStage, onDragToDeck }: StageProps) => {
  const stageItems = items.filter(item => item.status === 'onStage');

  return (
    <View style={styles.stageContainer}>
      <View style={styles.stageItems}>
        {stageItems.map(item => (
          <StageItem
            key={item.id}
            item={item}
            onRemove={onRemoveFromStage}
            onDragToDeck={onDragToDeck}
          />
        ))}

        {stageItems.length === 0 && (
          <Text style={styles.emptyMessage}>
            No items in staging area
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stageContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  stageItems: {
    flex: 1,
    padding: 10,
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  cargoItem: {
    backgroundColor: '#4a90e2',
    margin: 5,
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
    borderWidth: 2,
    borderColor: 'yellow',
    backgroundColor: '#5da0f2',
    zIndex: 999,
  },
  itemContentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  itemName: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
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
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    alignSelf: 'center',
    marginTop: 20,
  },
});

export default Stage;
