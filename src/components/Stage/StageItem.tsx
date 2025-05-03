import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './Stage.styles';

interface StageItemProps {
  item: CargoItem;
  onRemove: (id: string) => void;
  onDragToDeck: (id: string, position: { x: number, y: number }) => void;
}

const StageItem: React.FC<StageItemProps> = React.memo(({
  item,
  onRemove,
  onDragToDeck,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  const handleRemove = useCallback(() => {
    onRemove(item.id);
    setIsSelected(false);
  }, [onRemove, item.id]);

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
});

StageItem.displayName = 'StageItem';

export default StageItem; 