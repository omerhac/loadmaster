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
import { CargoType as DbCargoType } from './src/services/db/operations/types';
import Header from './src/components/Header/Header';
import Sidebar from './src/components/Sidebar/Sidebar';
import LoadingArea from './src/components/LoadingArea/LoadingArea';
import MissionSettingsComponent from './src/components/MissionSettings/MissionSettings';
import Preview from './src/components/Preview/Preview';
import initAppDatabase from './src/initAppDatabase';
import { getCargoItemsByMissionId, createCargoItem } from './src/services/db/operations/CargoItemOperations';
import { createCargoType } from './src/services/db/operations/CargoTypeOperations';
import { CargoItem as DbCargoItem } from './src/services/db/operations/types';
import { updateCargoItem } from './src/services/db/operations/CargoItemOperations';
import { deleteCargoItem } from './src/services/db/operations/CargoItemOperations';

const DEFAULT_MISSION_ID = 1;

initAppDatabase();


function convertDbCargoItemToCargoItem(item: DbCargoItem): CargoItem {
  if (!item.id) {
    throw new Error('Cargo item has no id');
  }
  const id = item.id.toString();
  const position = { x: item.x_start_position, y: item.y_start_position };
  const status = item.status ?? 'inventory';
  const name = item.name;
  const length = item.length ?? 0;
  const width = item.width ?? 0;
  const height = item.height ?? 0;
  const weight = item.weight ?? 0;
  const cog = item.cog ?? 0;
  const cargo_type_id = item.cargo_type_id ?? 1;
  return {
    id,
    cargo_type_id,
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
    async function getDefaultCargoItems() {
      const defaultCargoItems = await getCargoItemsByMissionId(DEFAULT_MISSION_ID);
      return defaultCargoItems;
    }

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

  const handleAddItem = useCallback(async (item: CargoItem, status: 'inventory' | 'onStage' | 'onDeck' = 'inventory') => {
    let newItem: DbCargoItem = {
      status: status,
      x_start_position: -1,
      y_start_position: -1,
      mission_id: DEFAULT_MISSION_ID, // TODO: use current mission
      cargo_type_id: item.cargo_type_id,
      name: item.name,
      length: item.length,
      width: item.width,
      height: item.height,
      weight: item.weight,
      cog: item.cog,
      forward_overhang: 0,
      back_overhang: 0,
    };
    try {
      const response = await createCargoItem(newItem);
      if (response && response.results && response.results.length > 0) {
        newItem.id = response.results[0].lastInsertId;
        const newItemForState = convertDbCargoItemToCargoItem(newItem);
        setCargoItems(prev => [...prev, newItemForState]);

        // Also add to mission settings if we have active mission settings
        if (missionSettings) {
          const manualCargoItem = {
            id: newItemForState.id,
            name: newItemForState.name,
            weight: newItemForState.weight,
            fs: newItemForState.fs || 0, // Use fs if available or default to 0
          };

          setMissionSettings(prev => {
            if (!prev) return null;
            return {
              ...prev,
              cargoItems: [...prev.cargoItems, manualCargoItem]
            };
          });
        }
      } else {
        console.error('Failed to add cargo item: Invalid response from createCargoItem', response);
      }
    } catch (error) {
      console.error('Error adding cargo item:', error);
    }
  }, [missionSettings]);

  const handleEditItem = useCallback((item: CargoItem) => {
    setCargoItems(prev => prev.map(i => i.id === item.id ? item : i));
    
    // Also update in mission settings if we have active mission settings
    if (missionSettings) {
      setMissionSettings(prev => {
        if (!prev) return null;
        
        // Check if the item exists in mission settings cargoItems
        const itemExists = prev.cargoItems.some(i => i.id === item.id);
        if (itemExists) {
          return {
            ...prev,
            cargoItems: prev.cargoItems.map(i => {
              if (i.id === item.id) {
                return {
                  ...i,
                  name: item.name,
                  weight: item.weight,
                  fs: item.fs || i.fs
                };
              }
              return i;
            })
          };
        }
        return prev;
      });
    }
  }, [missionSettings]);

  const handleDeleteItem = useCallback((id: string) => {
    // Remove from state
    setCargoItems(prev => prev.filter(item => item.id !== id));

    // Also remove from mission settings if we have active mission settings
    if (missionSettings) {
      setMissionSettings(prev => {
        if (!prev) return null;
        return {
          ...prev,
          cargoItems: prev.cargoItems.filter(item => item.id !== id)
        };
      });
    }

    // Also delete from the database
    try {
      deleteCargoItem(parseInt(id, 10));
    } catch (error) {
      console.error('Error deleting cargo item from database:', error);
    }
  }, [missionSettings]);

  const handleDuplicateItem = useCallback(async (id: string) => {
    const itemToDuplicate = cargoItems.find(item => item.id === id);
    if (!itemToDuplicate) {
      console.warn(`Item with id ${id} not found for duplication.`);
      return;
    }

    let newDbItem: DbCargoItem = {
      name: `${itemToDuplicate.name} (copy)`,
      status: 'inventory' as const,
      x_start_position: -1,
      y_start_position: -1,
      mission_id: DEFAULT_MISSION_ID,
      cargo_type_id: itemToDuplicate.cargo_type_id,
      length: itemToDuplicate.length,
      width: itemToDuplicate.width,
      height: itemToDuplicate.height,
      weight: itemToDuplicate.weight,
      cog: itemToDuplicate.cog,
      forward_overhang: 0, // TODO: Add forward overhang
      back_overhang: 0, // TODO: Add back overhang
    };

    try {
      const response = await createCargoItem(newDbItem);
      if (response && response.results && response.results.length > 0) {
        newDbItem.id = response.results[0].lastInsertId;
        const newItemForState = convertDbCargoItemToCargoItem(newDbItem);
        setCargoItems(prev => [...prev, newItemForState]);

        // Also add to mission settings if we have active mission settings
        if (missionSettings) {
          const manualCargoItem = {
            id: newItemForState.id,
            name: newItemForState.name,
            weight: newItemForState.weight,
            fs: newItemForState.fs || 0, // Use fs if available or default to 0
          };

          setMissionSettings(prev => {
            if (!prev) return null;
            return {
              ...prev,
              cargoItems: [...prev.cargoItems, manualCargoItem]
            };
          });
        }
      } else {
        console.error('Failed to duplicate item: Invalid response from createCargoItem', response);
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
    }
  }, [cargoItems, missionSettings]);

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

      console.log('newPosition', newPosition, status);
      updateCargoItem({
        id: parseInt(id, 10),
        status: status as 'onStage' | 'onDeck' | 'inventory',
        x_start_position: newPosition.x,
        y_start_position: newPosition.y,
        mission_id: DEFAULT_MISSION_ID,
        cargo_type_id: i.cargo_type_id,
        name: i.name,
        weight: i.weight,
        length: i.length,
        width: i.width,
        height: i.height,
        forward_overhang: 0, // TODO: Add forward overhang
        back_overhang: 0, // TODO: Add back overhang
        cog: i.cog,
      });

      return { ...i, status, position: newPosition };
    }));
  }, []);

  const handleSaveAsPreset = useCallback((item: CargoItem) => {
    const cargoType: DbCargoType = {
      name: item.name,
      default_weight: item.weight,
      default_length: item.length,
      default_width: item.width,
      default_height: item.height,
      default_cog: item.cog,
      default_forward_overhang: 0, // TODO: Add forward overhang
      default_back_overhang: 0, // TODO: Add back overhang
      type: 'bulk',
    };
    createCargoType(cargoType);
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
        onAddToMainCargo={handleAddItem}
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
