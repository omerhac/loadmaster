import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, findNodeHandle, UIManager } from 'react-native';
import { CargoItem } from '../../types';
import Deck from '../Deck/Deck';
import Stage from '../Stage/Stage';

type LoadingAreaProps = {
  items: CargoItem[];
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position?: { x: number, y: number }) => void;
};

const LoadingArea = ({ items, onUpdateItemStatus }: LoadingAreaProps) => {
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
          UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
            setDeckMeasurements({ 
              x: pageX, 
              y: pageY, 
              width, 
              height 
            });
          });
        }
      }
    };
    
    // Allow component to render first
    const timer = setTimeout(measureDeck, 500);
    return () => clearTimeout(timer);
  }, []);

  // Count items in stage
  const stageItems = items.filter(item => item.status === 'onStage');
  const stageItemCount = stageItems.length;

  // Handle dropping an item onto the deck
  const handleDrop = (id: string, position: { x: number, y: number }) => {
    onUpdateItemStatus(id, 'onDeck', position);
  };

  // Handle adding an item to the stage
  const handleAddToStage = (id: string) => {
    onUpdateItemStatus(id, 'onStage');
  };

  // Handle removing an item from the stage
  const handleRemoveFromStage = (id: string) => {
    onUpdateItemStatus(id, 'inventory');
  };
  
  // Handle removing an item from the deck (return to inventory)
  const handleRemoveFromDeck = (id: string) => {
    onUpdateItemStatus(id, 'inventory');
  };

  // Handle dragging an item from stage to deck
  const handleDragToDeck = (id: string, position: { x: number, y: number }) => {
    // Calculate relative position within the deck
    // Subtracting deck's position to get coordinates relative to deck
    // Add padding offset (10px from styles.deckContainer)
    const adjustedPosition = {
      x: Math.max(0, position.x - deckMeasurements.x - 10),
      y: Math.max(0, position.y - deckMeasurements.y - 10)
    };
    
    // Make sure the item stays within the deck boundaries
    if (adjustedPosition.x > deckMeasurements.width - 20) {
      adjustedPosition.x = deckMeasurements.width - 50;
    }
    
    if (adjustedPosition.y > deckMeasurements.height - 20) {
      adjustedPosition.y = deckMeasurements.height - 50;
    }
    
    onUpdateItemStatus(id, 'onDeck', adjustedPosition);
  };

  return (
    <View style={[
      styles.loadingArea,
      isTablet && styles.tabletLoadingArea,
      isLandscape && styles.landscapeLoadingArea,
    ]}>
      <View 
        ref={deckRef}
        style={styles.deckWrapper}
        onLayout={() => {
          // Re-measure when layout changes
          if (deckRef.current && Platform.OS !== 'web') {
            const nodeHandle = findNodeHandle(deckRef.current);
            if (nodeHandle) {
              UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
                setDeckMeasurements({ 
                  x: pageX, 
                  y: pageY, 
                  width, 
                  height 
                });
              });
            }
          }
        }}
      >
        <Deck
          items={items}
          onDrop={handleDrop}
          onRemoveFromDeck={handleRemoveFromDeck}
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
};

const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  tabletLoadingArea: {
    padding: 0,
  },
  landscapeLoadingArea: {
    flex: 3,
  },
  deckWrapper: {
    flex: 2,
  },
  stageAreaContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 10,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stageItemCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default LoadingArea;
