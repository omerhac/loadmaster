import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './Deck.styles';

interface DeckItemProps {
  item: CargoItem;
  onRemove?: (id: string) => void;
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position?: { x: number, y: number }) => void;
}

const DeckItem: React.FC<DeckItemProps> = React.memo(({
  item,
  onRemove,
  onUpdateItemStatus,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(item.position);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const xListener = translateX.addListener(({ value }) => {
      setCurrentPosition(prev => ({ ...prev, x: item.position.x + value }));
    });
    const yListener = translateY.addListener(({ value }) => {
      setCurrentPosition(prev => ({ ...prev, y: item.position.y + value }));
    });

    return () => {
      translateX.removeListener(xListener);
      translateY.removeListener(yListener);
    };
  }, [translateX, translateY, item.position.x, item.position.y, currentPosition]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(item.id);
    }
    setIsSelected(false);
  }, [onRemove, item.id]);

  // Allow dragging items that are already on the deck
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateX.extractOffset();
        translateY.extractOffset();

        setIsDragging(true);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {

        setIsDragging(false);
      },
    })
  ).current;

  useEffect(() => {
    if (!isDragging) {
      console.log('currentPosition', currentPosition);
      onUpdateItemStatus(item.id, 'onDeck', currentPosition);
    }
  }, [isDragging, currentPosition, onUpdateItemStatus, item.id]);

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
});

DeckItem.displayName = 'DeckItem';

export default DeckItem;
