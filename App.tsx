/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CargoItem, MissionSettings, Position, View as AppView } from './src/types';
import Header from './src/components/Header/Header';
import Sidebar from './src/components/Sidebar/Sidebar';
import LoadingArea from './src/components/LoadingArea/LoadingArea';
import MissionSettingsComponent from './src/components/MissionSettings/MissionSettings';
import Preview from './src/components/Preview/Preview';
import { v4 as uuidv4 } from 'uuid';

function getRandomDimension(min: number = 50, max: number = 120): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DEFAULT_CARGO_ITEMS: CargoItem[] = [
  {
    id: '1',
    name: 'Item 1',
    length: getRandomDimension(),
    width: getRandomDimension(),
    height: 100,
    weight: 100,
    cog: 50,
    status: 'inventory',
    position: { x: -1, y: -1 },
  },
  {
    id: '2',
    name: 'Item 2',
    length: getRandomDimension(),
    width: getRandomDimension(),
    height: 100,
    weight: 100,
    cog: 50,
    status: 'inventory',
    position: { x: -1, y: -1 },
  },
  {
    id: '3',
    name: 'Item 3',
    length: getRandomDimension(),
    width: getRandomDimension(),
    height: 100,
    weight: 100,
    cog: 50,
    status: 'inventory',
    position: { x: -1, y: -1 },
  },
];

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<AppView>('planning');
  const [missionSettings, setMissionSettings] = useState<MissionSettings | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>(DEFAULT_CARGO_ITEMS);

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
      if (!itemToDuplicate) {return prev;}

      const newItem = {
        ...itemToDuplicate,
        id: uuidv4(),
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
      if (i.id !== id) {return i;}

      const newPosition = status === 'onDeck'
        ? (position || i.position)
        : { x: -1, y: -1 };

      return { ...i, status, position: newPosition };
    }));
  }, []);

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
      <View style={styles.planningContainer}>
        <Header
          onSettingsClick={() => setCurrentView('settings')}
          onPreviewClick={() => setCurrentView('preview')}
        />
        <Sidebar
          items={cargoItems}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onUpdateItemStatus={handleUpdateItemStatus}
        />
        <LoadingArea
          items={cargoItems}
          onUpdateItemStatus={handleUpdateItemStatus}
        />
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
      <SafeAreaView style={styles.container}>
        {views[currentView]}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  planningContainer: {
    flex: 1,
  },
});

export default App;
