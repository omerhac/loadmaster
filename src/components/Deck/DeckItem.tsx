import React, { useRef, useState, useMemo } from 'react';
import { Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { CargoItem, Position } from '../../types';
import { styles } from './Deck.styles';
import DebugCoordinates, { SHOW_DEBUG_COORDS } from './DebugCoordinates';

// the offset of the "start loading from here position" in pixels
const FS_250_PIXEL_OFFSET = 11;

interface DeckItemProps {
  item: CargoItem;
  // the size of the deck in pixels
  deckSize: { width: number; height: number };
  // the offset of the top left corner of the deck in pixels
  deckOffset: { x: number; y: number };
  // the callback to remove the item
  onRemove?: (id: string) => void;
  // the callback to update the item status
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
  const fingerOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const panResponder = useMemo(
    () => PanResponder.create({
      // claim all touch events
      onStartShouldSetPanResponder: () => true,
      // only start dragging if the touch has moved enough
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      // start dragging callback
      onPanResponderGrant: (_e, gs) => {
        setIsDragging(true);
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        // compute the offset of the finger from the deck top left corner
        // gs.x0 and gs.y0 are the coordinates of the touch start
        const px0 = gs.x0 - deckOffset.x;
        const py0 = gs.y0 - deckOffset.y;
        // compute the finger offset from the item top left corner of the item
        fingerOffsetRef.current = { x: px0 - item.position.x, y: py0 - item.position.y };
      },
      // on drag move callback
      onPanResponderMove: (_e, gs) => {
        // gs.moveX and gs.moveY are the latest coordinates of the finger
        const px = gs.moveX - deckOffset.x - fingerOffsetRef.current.x;
        const py = gs.moveY - deckOffset.y - fingerOffsetRef.current.y;
        const clampedX = Math.max(FS_250_PIXEL_OFFSET, Math.min(px, deckSize.width - item.width));
        const clampedY = Math.max(0, Math.min(py, deckSize.height - item.length));
        setDragPosition({ x: clampedX, y: clampedY });
      },
      // on drag release callback
      onPanResponderRelease: (_e, _gs) => {
        const finalPos = dragPosition ?? item.position;
        setIsDragging(false);
        setDragPosition(null);
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        onUpdateItemStatus(item.id, 'onDeck', finalPos);

        // compute the corners of the item in the deck coordinate system
        // (convert from pixel space to deck space)
        const corners = {
          bottomLeft: { x: finalPos.x, y: finalPos.y + item.length },
          bottomRight: { x: finalPos.x + item.width, y: finalPos.y + item.length },
          topLeft: { x: finalPos.x, y: finalPos.y },
          topRight: { x: finalPos.x + item.width, y: finalPos.y },
        };
        console.log('Dropped corners:', { corners });
      },
      // on pan responder terminate callback
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
