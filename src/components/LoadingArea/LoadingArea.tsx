import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Platform, Dimensions, findNodeHandle, UIManager } from 'react-native';
import { CargoItem } from '../../types';
import Deck from '../Deck/Deck';
import Stage from '../Stage/Stage';
import { styles } from './LoadingArea.styles';

interface LoadingAreaProps {
  items: CargoItem[];
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position?: { x: number, y: number }) => void;
}

const LoadingArea: React.FC<LoadingAreaProps> = React.memo(({ items, onUpdateItemStatus }) => {
  const isIpad = Platform.OS === 'ios' && Platform.isPad;
  const isWindows = Platform.OS === 'windows';
  const isTablet = isIpad || isWindows || (Platform.OS === 'android' && Dimensions.get('window').width > 900);
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  // Refs for measuring components
  const deckRef = useRef<View>(null);
  const [deckMeasurements, setDeckMeasurements] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Measure the deck component after layout
  useEffect(() => {
    const measureDeck = () => {
      if (deckRef.current && Platform.OS !== 'web') {
        const nodeHandle = findNodeHandle(deckRef.current);
        if (nodeHandle) {
          UIManager.measure(nodeHandle, (x, y, width_, height_, pageX, pageY) => {
            setDeckMeasurements({
              x: pageX,
              y: pageY,
              width: width_ ,
              height: height_,
            });
          });
        }
      }
    };

    // Allow component to render first
    const timer = setTimeout(measureDeck, 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate styles based on device properties
  const containerStyle = useMemo(() => [
    styles.loadingArea,
    isTablet && styles.tabletLoadingArea,
    isLandscape && styles.landscapeLoadingArea,
  ], [isTablet, isLandscape]);

  // Count items in stage
  const stageItems = useMemo(() =>
    items.filter(item => item.status === 'onStage'),
    [items]
  );
  const stageItemCount = stageItems.length;

  // Handle adding an item to the stage
  const handleAddToStage = useCallback((id: string) => {
    onUpdateItemStatus(id, 'onStage');
  }, [onUpdateItemStatus]);

  // Handle removing an item from the stage
  const handleRemoveFromStage = useCallback((id: string) => {
    onUpdateItemStatus(id, 'inventory');
  }, [onUpdateItemStatus]);

  // Handle removing an item from the deck (return to inventory)
  const handleRemoveFromDeck = useCallback((id: string) => {
    onUpdateItemStatus(id, 'inventory');
  }, [onUpdateItemStatus]);

  // Handle dragging an item from stage to deck
  const handleDragToDeck = useCallback((id: string, position: { x: number, y: number }) => {
    // Calculate relative position within the deck
    // Subtracting deck's position to get coordinates relative to deck
    // Add padding offset (10px from styles.deckContainer)
    const adjustedPosition = {
      x: Math.max(0, position.x - deckMeasurements.x - 10),
      y: Math.max(0, position.y - deckMeasurements.y - 10),
    };

    // Make sure the item stays within the deck boundaries
    if (adjustedPosition.x > deckMeasurements.width - 20) {
      adjustedPosition.x = deckMeasurements.width - 50;
    }

    if (adjustedPosition.y > deckMeasurements.height - 20) {
      adjustedPosition.y = deckMeasurements.height - 50;
    }

    onUpdateItemStatus(id, 'onDeck', adjustedPosition);
  }, [deckMeasurements, onUpdateItemStatus]);

  const handleLayout = useCallback(() => {
    // Re-measure when layout changes
    if (deckRef.current && Platform.OS !== 'web') {
      const nodeHandle = findNodeHandle(deckRef.current);
      if (nodeHandle) {
        UIManager.measure(nodeHandle, (x, y, width_, height_, pageX, pageY) => {
          setDeckMeasurements({
            x: pageX,
            y: pageY,
            width: width_,
            height: height_,
          });
        });
      }
    }
  }, []);

  // Compute inner deck dimensions (subtract 10px padding each side)
  const innerDeckWidth = Math.max(0, deckMeasurements.width - 20);
  const innerDeckHeight = Math.max(0, deckMeasurements.height - 20);

  return (
    <View style={containerStyle}>
      <View
        ref={deckRef}
        style={styles.deckWrapper}
        onLayout={handleLayout}
      >
        <Deck
          items={items}
          deckSize={{ width: innerDeckWidth, height: innerDeckHeight }}
          deckOffset={{ x: deckMeasurements.x + 10, y: deckMeasurements.y + 10 }}
          onRemoveFromDeck={handleRemoveFromDeck}
          onUpdateItemStatus={onUpdateItemStatus}
        />
      </View>

      <View style={styles.stageAreaContainer}>
        <View style={styles.stageHeader}>
          <Text style={styles.stageTitle}>Stage Area</Text>
          <Text style={styles.stageItemCount}>{stageItemCount} items</Text>
        </View>

        <Stage
          items={items}
          onRemoveFromStage={handleRemoveFromStage}
          onAddToStage={handleAddToStage}
          onDragToDeck={handleDragToDeck}
        />
      </View>
    </View>
  );
});

LoadingArea.displayName = 'LoadingArea';

export default LoadingArea;
