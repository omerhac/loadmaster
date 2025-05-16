import React, { useRef, useState, useMemo } from 'react';
import { Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { CargoItem, Position } from '../../types';
import { styles } from './Deck.styles';
import DebugCoordinates, { SHOW_DEBUG_COORDS } from './DebugCoordinates';

interface DeckItemProps {
  item: CargoItem;
  deckSize: { width: number; height: number };
  deckOffset: { x: number; y: number };
  onRemove?: (id: string) => void;
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position: { x: number, y: number }) => void;
}

const DeckItem: React.FC<DeckItemProps> = React.memo(({
  item,
  deckSize,
  deckOffset,
  onRemove,
  onUpdateItemStatus,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderGrant: (_e, gs) => {
        setIsDragging(true);
        Animated.spring(scale, { toValue: 1.1, friction: 5, useNativeDriver: true }).start();
        const px0 = gs.x0 - deckOffset.x;
        const py0 = gs.y0 - deckOffset.y;
        offsetRef.current = { x: px0 - item.position.x, y: py0 - item.position.y };
      },
      onPanResponderMove: (_e, gs) => {
        const px = gs.moveX - deckOffset.x - offsetRef.current.x;
        const py = gs.moveY - deckOffset.y - offsetRef.current.y;
        const clampedX = Math.max(0, Math.min(px, deckSize.width - item.width));
        const clampedY = Math.max(0, Math.min(py, deckSize.height - item.length));
        setDragPosition({ x: clampedX, y: clampedY });
      },
      onPanResponderRelease: (_e, _gs) => {
        const finalPos = dragPosition ?? item.position;
        setIsDragging(false);
        setDragPosition(null);
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        onUpdateItemStatus(item.id, 'onDeck', finalPos);
        const scaleFactor = 600 / deckSize.width;
        const corners = {
          bottomLeft: { x: finalPos.x, y: finalPos.y + item.length },
          bottomRight: { x: finalPos.x + item.width, y: finalPos.y + item.length },
          topLeft: { x: finalPos.x, y: finalPos.y },
          topRight: { x: finalPos.x + item.width, y: finalPos.y },
        };
        const normalized = Object.fromEntries(
          (Object.entries(corners) as [string, Position][]).map(([k, { x, y }]) => [
            k,
            {
              x: parseFloat((x * scaleFactor).toFixed(2)),
              y: parseFloat(((deckSize.height - y) * scaleFactor).toFixed(2)),
            },
          ])
        );
        console.log('Dropped corners:', { corners, normalized });
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setDragPosition(null);
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      },
    }),
    [deckOffset.x, deckOffset.y,
    deckSize.width, deckSize.height, dragPosition,
    item.id, item.length, item.position,
    item.width, onUpdateItemStatus, scale]
  );

  const pos = dragPosition ?? item.position;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cargoItem,
        {
          width: item.width,
          height: item.length,
          left: pos.x,
          top: pos.y,
          transform: [{ scale }],
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
            onPress={() => { onRemove(item.id); setIsSelected(false); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {SHOW_DEBUG_COORDS && (
        <DebugCoordinates
          pos={pos}
          itemWidth={item.width}
          itemHeight={item.length}
          deckSize={deckSize}
        />
      )}
    </Animated.View>
  );
});

DeckItem.displayName = 'DeckItem';

export default DeckItem;
