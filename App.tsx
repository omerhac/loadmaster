/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Platform, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CargoItem, MissionSettings, Position, View as AppView } from './src/types';
import Header from './src/components/Header/Header';
import Sidebar from './src/components/Sidebar/Sidebar';
import LoadingArea from './src/components/LoadingArea/LoadingArea';
import MissionSettingsComponent from './src/components/MissionSettings/MissionSettings';
import Preview from './src/components/Preview/Preview';
import initAppDatabase from './src/initAppDatabase';
import { getCargoItemsByMissionId } from './src/services/db/operations/CargoItemOperations';
import { CargoItem as DbCargoItem } from './src/services/db/operations/types';

const DEFAULT_MISSION_ID = 1;

initAppDatabase();

async function getDefaultCargoItems() {
  const defaultCargoItems = await getCargoItemsByMissionId(DEFAULT_MISSION_ID);
  return defaultCargoItems;
}
getDefaultCargoItems().then(items => console.log(items));

// Helper function to generate a simple ID without relying on crypto
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};


function convertDbCargoItemToCargoItem(item: DbCargoItem): CargoItem {
  const id = item.id?.toString() ?? generateId();
  const position = { x: item.x_start_position, y: item.y_start_position };
  const status = item.status ?? 'inventory';
  const name = item.name;
  const length = item.length ?? 0;
  const width = item.width ?? 0;
  const height = item.height ?? 0;
  const weight = item.weight ?? 0;
  const cog = item.cog ?? 0;
  return {
    id,
    name,
    length,
    width,
    height,
    weight,
    cog,
    status,
    position,
  };
}

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<AppView>('planning');
  const [missionSettings, setMissionSettings] = useState<MissionSettings | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    getDefaultCargoItems().then(items => {
      const dbCargoItems: DbCargoItem[] = items.results.map(item => item?.data as DbCargoItem);
      const convertedItems: CargoItem[] = dbCargoItems.map(convertDbCargoItemToCargoItem);
      setCargoItems(convertedItems);
    });
  }, []);

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };

    updateOrientation();

    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription.remove();
  }, []);

  const handleAddItem = useCallback((item: CargoItem) => {
    setCargoItems(prev => [...prev, item]);
  }, []);

  const handleEditItem = useCallback((item: CargoItem) => {
    setCargoItems(prev => prev.map(i => i.id === item.id ? item : i));
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setCargoItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleDuplicateItem = useCallback((id: string) => {
    setCargoItems(prev => {
      const itemToDuplicate = prev.find(item => item.id === id);
      if (!itemToDuplicate) { return prev; }

      const newItem = {
        ...itemToDuplicate,
        id: generateId(),
        name: `${itemToDuplicate.name} (copy)`,
        status: 'inventory' as const,
        position: { x: -1, y: -1 },
      };
      return [...prev, newItem];
    });
  }, []);

  const handleUpdateItemStatus = useCallback((
    id: string,
    status: 'onStage' | 'onDeck' | 'inventory',
    position?: Position
  ) => {
    setCargoItems(prev => prev.map(i => {
      if (i.id !== id) { return i; }

      const newPosition = status === 'onDeck'
        ? (position || i.position)
        : { x: -1, y: -1 };

      return { ...i, status, position: newPosition };
    }));
  }, []);

  const handleSaveAsPreset = useCallback((item: CargoItem) => {
    // This would typically save the item to persistent storage
    // For now just log a message
    console.log('Saved item as preset:', item.name);
  }, []);

  const handleAddToStage = useCallback((id: string) => {
    handleUpdateItemStatus(id, 'onStage');
  }, [handleUpdateItemStatus]);

  const handleRemoveFromStage = useCallback((id: string) => {
    handleUpdateItemStatus(id, 'inventory');
  }, [handleUpdateItemStatus]);

  const handleMissionSave = useCallback((settings: MissionSettings) => {
    setMissionSettings(settings);
    setCurrentView('planning');
  }, []);

  const handleSavePreviewItems = useCallback((items: CargoItem[]) => {
    setCargoItems(prev => prev.map(item => {
      const editedItem = items.find(i => i.id === item.id);
      return editedItem || item;
    }));
  }, []);

  const views = {
    settings: (
      <MissionSettingsComponent
        settings={missionSettings ?? undefined}
        onReturn={() => setCurrentView('planning')}
        onSave={handleMissionSave}
      />
    ),
    planning: (
      <View style={[styles.planningContainer, isLandscape ? styles.landscapeContainer : null]}>
        <Header
          onSettingsClick={() => setCurrentView('settings')}
          onPreviewClick={() => setCurrentView('preview')}
        />
        <View style={styles.contentContainer}>
          <Sidebar
            items={cargoItems}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onUpdateItemStatus={handleUpdateItemStatus}
            onSaveAsPreset={handleSaveAsPreset}
            onAddToStage={handleAddToStage}
            onRemoveFromStage={handleRemoveFromStage}
          />
          <LoadingArea
            items={cargoItems}
            onUpdateItemStatus={handleUpdateItemStatus}
          />
        </View>
      </View>
    ),
    preview: (
      <Preview
        items={cargoItems}
        onSave={handleSavePreviewItems}
        onReturn={() => setCurrentView('planning')}
      />
    ),
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        {views[currentView]}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  planningContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  landscapeContainer: {
    flexDirection: 'column',
  },
  tabletContainer: {
    padding: Platform.OS === 'windows' ? 8 : 0,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default App;
