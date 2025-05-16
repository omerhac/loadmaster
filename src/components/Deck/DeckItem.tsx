import React, { useRef, useState, useMemo } from 'react';
import { Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { CargoItem, Position } from '../../types';
import { styles } from './Deck.styles';
import DebugCoordinates, { SHOW_DEBUG_COORDS } from './DebugCoordinates';

// the offset of the "start loading from here position" relative to 
// the deck image width (from deck start)
const FS_250_PIXEL_RELATIVE_OFFSET = 0.0195903829;
// the offset of the "stop loading here position" relative to 
// the deck image width (from deck end)
const FS_849_PIXEL_RELATIVE_OFFSET = 0.04274265361;
// the offset of the top of the deck
// relative to the deck image height
const DECK_Y_TOP_BOUND_RELATIVE_OFFSET = 0.3552311436;
// the offset of the bottom of the deck
// relative to the deck image height
const DECK_Y_BOTTOM_BOUND_RELATIVE_OFFSET = 0.1265206813;
// the relative width of the deck in the image
// from fs_250 to fs_849
const LOADING_AREA_RELATIVE_WIDTH_IN_IMAGE = 0.9376669635;
// the width of the loading area in inches
// from fs_250 to fs_849
const LOADING_AREA_WIDTH_IN_INCHES = 599;

function convertPixelToInchesSize(sizeInPixel: number, deckSize: { width: number; height: number }) {
  const loadingAreaPixelWidth = deckSize.width * LOADING_AREA_RELATIVE_WIDTH_IN_IMAGE;
  const relativeSize = sizeInPixel / loadingAreaPixelWidth;
  return relativeSize * LOADING_AREA_WIDTH_IN_INCHES;
}

function convertPixelPointToInchesPoint(pointInPixel: { x: number; y: number }, deckSize: { width: number; height: number }) {
  return {
    x: convertPixelToInchesSize(pointInPixel.x, deckSize),
    y: convertPixelToInchesSize(pointInPixel.y, deckSize),
  };
}

function convertPixelCornersToInchesCorners(cornersInPixel: { [key: string]: { x: number; y: number } }, deckSize: { width: number; height: number }) {
  return Object.fromEntries(
    Object.entries(cornersInPixel).map(([key, value]) => [key, convertPixelPointToInchesPoint(value, deckSize)])
  );
}

function convertInchesToPixelSize(inches: number, deckSize: { width: number; height: number }) {
  const loadingAreaPixelWidth = deckSize.width * LOADING_AREA_RELATIVE_WIDTH_IN_IMAGE;
  const relativeSize = inches / LOADING_AREA_WIDTH_IN_INCHES;
  return relativeSize * loadingAreaPixelWidth;
}

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

  const itemPixelWidth = convertInchesToPixelSize(item.width, deckSize);
  const itemPixelHeight = convertInchesToPixelSize(item.length, deckSize);
  console.log('deckSizeInPixels', deckSize);
  console.log('loadingAreaPixelWidth', deckSize.width * LOADING_AREA_RELATIVE_WIDTH_IN_IMAGE);
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
        const fs_250_pixel_offset = deckSize.width * FS_250_PIXEL_RELATIVE_OFFSET;
        const fs_849_pixel_offset = deckSize.width * FS_849_PIXEL_RELATIVE_OFFSET;
        const deck_y_top_bound_pixel_offset = deckSize.height * DECK_Y_TOP_BOUND_RELATIVE_OFFSET;
        const deck_y_bottom_bound_pixel_offset = deckSize.height * DECK_Y_BOTTOM_BOUND_RELATIVE_OFFSET;
        const clampedX = Math.max(fs_250_pixel_offset, Math.min(px, deckSize.width - itemPixelWidth - fs_849_pixel_offset));
        const clampedY = Math.max(deck_y_top_bound_pixel_offset, Math.min(py, deckSize.height - itemPixelHeight - deck_y_bottom_bound_pixel_offset));
        setDragPosition({ x: clampedX, y: clampedY });
      },
      // on drag release callback
      onPanResponderRelease: (_e, _gs) => {
        const finalPos = dragPosition ?? item.position;
        setIsDragging(false);
        setDragPosition(null);
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        onUpdateItemStatus(item.id, 'onDeck', finalPos);


      },
      // on pan responder terminate callback
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setDragPosition(null);
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      },
    }),
    [deckOffset.x, deckOffset.y,
    deckSize.width, deckSize.height,
      dragPosition, item.position, item.id,
      onUpdateItemStatus, scale,
      itemPixelWidth, itemPixelHeight]
  );

  const currentPosition = dragPosition ?? item.position;
  // compute the corners of the item in the deck coordinate system
  // (convert from pixel space to deck space)
  const pixelCorners = {
    bottomLeft: { x: currentPosition.x, y: currentPosition.y + itemPixelHeight },
    bottomRight: { x: currentPosition.x + itemPixelWidth, y: currentPosition.y + itemPixelHeight },
    topLeft: { x: currentPosition.x, y: currentPosition.y },
    topRight: { x: currentPosition.x + itemPixelWidth, y: currentPosition.y },
  };
  const inchesCorners = convertPixelCornersToInchesCorners(pixelCorners, deckSize);
  console.log('Dropped pixel corners:', { corners: pixelCorners });
  console.log('Dropped inches corners:', { corners: inchesCorners });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cargoItem,
        {
          width: itemPixelWidth,
          height: itemPixelHeight,
          left: currentPosition.x,
          top: currentPosition.y,
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
          corners={{
            topLeft: inchesCorners.topLeft,
            topRight: inchesCorners.topRight,
            bottomLeft: inchesCorners.bottomLeft,
            bottomRight: inchesCorners.bottomRight,
          }}
        />
      )}
    </Animated.View>
  );
});

DeckItem.displayName = 'DeckItem';

export default DeckItem;
