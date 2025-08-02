import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, PanResponder, Animated, TextInput, View } from 'react-native';
import { CargoItem, Position } from '../../types';
import { styles } from './Deck.styles';
import DebugCoordinates, { SHOW_DEBUG_COORDS } from './DebugCoordinates';
import { PencilIcon } from '../icons';

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

const DECK_IMAGE_ASPECT_RATIO = 2.649;

const DOCK_OPTIONS = ['Back', 'CoG', 'Front'] as const;
type DockType = typeof DOCK_OPTIONS[number];
const DOCK_DISPLAY_MAP: Record<DockType, string> = { Back: 'B', CoG: 'C', Front: 'F' };

function calculateActualImageBounds(containerSize: { width: number; height: number }) {
  const containerAspectRatio = containerSize.width / containerSize.height;

  let actualWidth, actualHeight, offsetX, offsetY;

  if (containerAspectRatio > DECK_IMAGE_ASPECT_RATIO) {
    // Container is wider than image - letterboxing on left/right
    actualHeight = containerSize.height;
    actualWidth = actualHeight * DECK_IMAGE_ASPECT_RATIO;
    offsetX = (containerSize.width - actualWidth) / 2;
    offsetY = 0;
  } else {
    // Container is taller than image - letterboxing on top/bottom
    actualWidth = containerSize.width;
    actualHeight = actualWidth / DECK_IMAGE_ASPECT_RATIO;
    offsetX = 0;
    offsetY = (containerSize.height - actualHeight) / 2;
  }

  return {
    width: actualWidth,
    height: actualHeight,
    offsetX,
    offsetY,
  };
}

function convertPixelToInchesSize(sizeInPixel: number, deckSize: { width: number; height: number }) {
  const actualBounds = calculateActualImageBounds(deckSize);
  const loadingAreaPixelWidth = actualBounds.width * LOADING_AREA_RELATIVE_WIDTH_IN_IMAGE;
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
  const actualBounds = calculateActualImageBounds(deckSize);
  const loadingAreaPixelWidth = actualBounds.width * LOADING_AREA_RELATIVE_WIDTH_IN_IMAGE;
  const relativeSize = inches / LOADING_AREA_WIDTH_IN_INCHES;
  return relativeSize * loadingAreaPixelWidth;
}

function convertInchesToPixelPoint(pointInInches: { x: number; y: number }, deckSize: { width: number; height: number }) {
  return {
    x: convertInchesToPixelSize(pointInInches.x, deckSize),
    y: convertInchesToPixelSize(pointInInches.y, deckSize),
  };
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
  onEditItem?: (item: CargoItem) => void;
}

const DeckItem: React.FC<DeckItemProps> = ({
  item,
  deckSize,
  deckOffset,
  onRemove,
  onUpdateItemStatus,
  onEditItem,
}) => {
  console.log('=== DeckItem RENDER ===');
  console.log('Item ID:', item.id);
  console.log('Item position:', item.position);
  console.log('Item status:', item.status);

  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const [isFsEditVisible, setIsFsEditVisible] = useState(false);
  const [fsInput, setFsInput] = useState(item.fs.toString());
  const [dockInput, setDockInput] = useState<DockType>(item.dock || 'CoG');

  // Store all changing values in refs to keep them accessible to PanResponder
  const itemRef = useRef(item);
  const deckSizeRef = useRef(deckSize);
  const deckOffsetRef = useRef(deckOffset);
  const onUpdateItemStatusRef = useRef(onUpdateItemStatus);
  const fingerOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentDragPositionRef = useRef<Position | null>(null);

  // Update refs on every render
  itemRef.current = item;
  deckSizeRef.current = deckSize;
  deckOffsetRef.current = deckOffset;
  onUpdateItemStatusRef.current = onUpdateItemStatus;

  const itemPixelWidth = convertInchesToPixelSize(item.width, deckSize);
  const itemPixelHeight = convertInchesToPixelSize(item.length, deckSize);
  const actualBounds = calculateActualImageBounds(deckSize);
  const FS_250_INCHES_OFFSET = convertPixelToInchesSize(FS_250_PIXEL_RELATIVE_OFFSET * actualBounds.width, deckSize);

  // Cache the offset calculation to ensure consistency during drag operations
  const inchesOffset = convertPixelToInchesSize(actualBounds.offsetX + (FS_250_PIXEL_RELATIVE_OFFSET * actualBounds.width), deckSize);

  const canonicalizePosition = (position: Position) => {
    return {
      x: position.x - inchesOffset + 250,
      y: position.y,
    };
  };

  const uncanonicalizePosition = (position: Position) => {
    return {
      x: position.x + inchesOffset - 250,
      y: position.y,
    };
  };

  // Create PanResponder once with useRef
  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (_e, gs) => {
        console.log('=== DRAG START ===');
        const currentItem = itemRef.current;
        const currentDeckOffset = deckOffsetRef.current;

        console.log('Current item position:', currentItem.position);
        console.log('Touch coordinates:', { x0: gs.x0, y0: gs.y0 });

        setIsDragging(true);

        // Calculate finger offset from item's top-left corner
        const px0 = gs.x0 - currentDeckOffset.x;
        const py0 = gs.y0 - currentDeckOffset.y;
        const itemInchesPos = uncanonicalizePosition(currentItem.position);
        const itemPixelPos = convertInchesToPixelPoint(itemInchesPos, deckSizeRef.current);

        fingerOffsetRef.current = {
          x: px0 - itemPixelPos.x,
          y: py0 - itemPixelPos.y,
        };

        console.log('Finger offset:', fingerOffsetRef.current);
      },

      onPanResponderMove: (_e, gs) => {
        const currentDeckOffset = deckOffsetRef.current;
        const currentDeckSize = deckSizeRef.current;
        const currentItem = itemRef.current;

        // Calculate actual image bounds within container
        const currActualBounds = calculateActualImageBounds(currentDeckSize);

        // Calculate new position relative to the container
        const px = gs.moveX - currentDeckOffset.x - fingerOffsetRef.current.x;
        const py = gs.moveY - currentDeckOffset.y - fingerOffsetRef.current.y;

        // Apply bounds based on actual image position and size
        const fs_250_pixel_offset = currActualBounds.offsetX + (currActualBounds.width * FS_250_PIXEL_RELATIVE_OFFSET);
        const fs_849_pixel_offset = currActualBounds.width * FS_849_PIXEL_RELATIVE_OFFSET;
        const deck_y_top_bound = currActualBounds.offsetY + (currActualBounds.height * DECK_Y_TOP_BOUND_RELATIVE_OFFSET);
        const deck_y_bottom_bound = currActualBounds.height * DECK_Y_BOTTOM_BOUND_RELATIVE_OFFSET;

        const itemWidth = convertInchesToPixelSize(currentItem.width, currentDeckSize);
        const itemHeight = convertInchesToPixelSize(currentItem.length, currentDeckSize);

        const clampedX = Math.max(
          fs_250_pixel_offset,
          Math.min(px, currActualBounds.offsetX + currActualBounds.width - itemWidth - fs_849_pixel_offset)
        );
        const clampedY = Math.max(
          deck_y_top_bound,
          Math.min(py, currActualBounds.offsetY + currActualBounds.height - itemHeight - deck_y_bottom_bound)
        );

        const newPos = { x: clampedX, y: clampedY };
        currentDragPositionRef.current = newPos;
        setDragPosition(newPos);
      },

      onPanResponderRelease: () => {
        console.log('=== DRAG RELEASE ===');
        const currentItem = itemRef.current;
        const finalPixelPos = currentDragPositionRef.current ?? uncanonicalizePosition(currentItem.position);
        
        // Convert pixel position to inches first, then canonicalize
        const finalInchesPos = convertPixelPointToInchesPoint(finalPixelPos, deckSizeRef.current);
        const finalCanonicalPos = canonicalizePosition(finalInchesPos);

        console.log('Final pixel position:', finalPixelPos);
        console.log('Final inches position:', finalInchesPos);
        console.log('Final canonical position:', finalCanonicalPos);

        setIsDragging(false);
        setDragPosition(null);
        currentDragPositionRef.current = null;

        onUpdateItemStatusRef.current(currentItem.id, 'onDeck', finalCanonicalPos);
      },

      onPanResponderTerminate: () => {
        console.log('=== DRAG TERMINATED ===');
        setIsDragging(false);
        setDragPosition(null);
        currentDragPositionRef.current = null;
      },
    })
  );

  console.log('FS_250_INCHES_OFFSET', FS_250_INCHES_OFFSET);
  console.log('deckSizeInPixels', deckSize);

  const panResponder = panResponderRef.current;

  // Get current position in pixel coordinates for rendering
  const currentPosition = dragPosition ?? (() => {
    const uncanonicalizedInches = uncanonicalizePosition(item.position);
    return convertInchesToPixelPoint(uncanonicalizedInches, deckSize);
  })();
  
  console.log('Current position (for rendering):', currentPosition);
  console.log('Is dragging:', isDragging);

  // compute the corners of the item in the deck coordinate system
  // (convert from pixel space to deck space and then to canonical deck space)
  const pixelCorners = {
    bottomLeft: { x: currentPosition.x, y: currentPosition.y + itemPixelHeight },
    bottomRight: { x: currentPosition.x + itemPixelWidth, y: currentPosition.y + itemPixelHeight },
    topLeft: { x: currentPosition.x, y: currentPosition.y },
    topRight: { x: currentPosition.x + itemPixelWidth, y: currentPosition.y },
  };
  const inchesCorners = convertPixelCornersToInchesCorners(pixelCorners, deckSize);
  const canonicalInchesCorners = Object.fromEntries(
    Object.entries(inchesCorners).map(([key, value]) => [key, canonicalizePosition(value)])
  );
  console.log('Dropped pixel corners:', { corners: pixelCorners });
  console.log('Dropped inches corners:', { corners: inchesCorners });
  console.log('Dropped canonical inches corners:', { corners: canonicalInchesCorners });

  return (
    <>
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
          {isSelected && !isDragging && (
            <>
              {onRemove && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => { onRemove(item.id); setIsSelected(false); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setIsFsEditVisible(true);
                  setFsInput(item.fs.toString());
                  setDockInput(item.dock || 'CoG');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <PencilIcon />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
        {isFsEditVisible && (
          <View style={styles.fsEditPopover}>
            <View style={styles.fsAndDockContainer}>
              <TextInput
                style={styles.fsEditInput}
                value={fsInput}
                onChangeText={setFsInput}
                keyboardType="numeric"
                placeholder="FS"
                placeholderTextColor="#aaa"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.dockOption, styles.dockOptionSingle]}
                onPress={() => {
                  const currentIndex = DOCK_OPTIONS.indexOf(dockInput);
                  const nextIndex = (currentIndex + 1) % DOCK_OPTIONS.length;
                  setDockInput(DOCK_OPTIONS[nextIndex]);
                }}
              >
                <Text style={[
                  styles.dockOptionText,
                  styles.dockOptionTextSelected,
                ]}>{DOCK_DISPLAY_MAP[dockInput]}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fsOkCancelContainer}>
              <TouchableOpacity
                style={styles.fsEditConfirm}
                onPress={() => {
                  const newFs = parseInt(fsInput, 10);
                  if (!isNaN(newFs) && onEditItem) {
                    onEditItem({ ...item, fs: newFs, dock: dockInput });
                  }
                  // Do NOT close the popover here
                }}
              >
                <Text style={styles.fsEditConfirmText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fsEditCancel}
                onPress={() => setIsFsEditVisible(false)}
              >
                <Text style={styles.fsEditCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {SHOW_DEBUG_COORDS && (
          <DebugCoordinates
            corners={{
              topLeft: canonicalInchesCorners.topLeft,
              topRight: canonicalInchesCorners.topRight,
              bottomLeft: canonicalInchesCorners.bottomLeft,
              bottomRight: canonicalInchesCorners.bottomRight,
            }}
          />
        )}
      </Animated.View>
    </>
  );
};

DeckItem.displayName = 'DeckItem';

export default DeckItem;
