/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Platform, Dimensions, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Host } from 'react-native-portalize';
import { CargoItem, MissionSettings, Position } from './src/types';
import { Aircraft, CargoType as DbCargoType, Mission } from './src/services/db/operations/types';
import Header from './src/components/Header/Header';
import Sidebar from './src/components/Sidebar/Sidebar';
import LoadingArea from './src/components/LoadingArea/LoadingArea';
import MissionSettingsComponent from './src/components/MissionSettings/MissionSettings';
import Preview from './src/components/Preview/Preview';
import NewMissionModal from './src/components/NewMissionModal/NewMissionModal';
import LoadMissionModal from './src/components/LoadMissionModal/LoadMissionModal';
import initAppDatabase from './src/initAppDatabase';
import { getCargoItemsByMissionId, createCargoItem } from './src/services/db/operations/CargoItemOperations';
import { createCargoType } from './src/services/db/operations/CargoTypeOperations';
import { CargoItem as DbCargoItem } from './src/services/db/operations/types';
import { updateCargoItem } from './src/services/db/operations/CargoItemOperations';
import { deleteCargoItem } from './src/services/db/operations/CargoItemOperations';
import { getAircraftById, updateAircraft } from './src/services/db/operations/AircraftOperations';
import { getMissionById, createMission } from './src/services/db/operations/MissionOperations';
import { DEFAULT_MISSION_ID, DEFAULT_NEW_MISSION, DEFAULT_Y_POS } from './src/constants';
import { updateMission } from './src/services/db/operations/MissionOperations';
import { xPositionToFs, fsToXPosition, updateCargoItemPosition } from './src/utils/cargoUtils';
import { Graphs } from './src/components/Graphs/Graphs';
import { Images } from './src/assets';
import { calculateMACPercent, calculateTotalAircraftWeight, calculateBaseWeight, calculateTotalFuelWeight, calculateCargoWeight } from './src/services/mac';
import AddCargoItemModal from './src/components/AddCargoItemModal/AddCargoItemModal';
import { getAllCargoTypes } from './src/services/db/operations/CargoTypeOperations';

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
  // Only calculate FS for items that are onDeck, otherwise default to 0
  const fs = status === 'onDeck' ? xPositionToFs(item.x_start_position, cog) : 0;
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
    fs,
    dock: 'CG',
    color: item.color || '#4a90e2', // Use saved color or default blue
  };
}

async function convertDbMissionToMissionSettings(mission: Mission): Promise<MissionSettings> {
  if (!mission.id) {
    throw new Error('Mission has no id');
  }
  const aircraftResponse = await getAircraftById(mission.aircraft_id);
  if (aircraftResponse.results.length === 0) {
    throw new Error('Aircraft not found');
  }
  const aircraft: Aircraft = (aircraftResponse.results[0].data as Aircraft);

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) {
      return 0;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const result = {
    id: mission.id.toString(),
    name: mission.name || '',
    date: mission.created_date || new Date().toISOString().split('T')[0],
    departureLocation: 'Nevatim',
    arrivalLocation: 'Ramat David',
    aircraftIndex: toNumber(aircraft.empty_mac),
    aircraftEmptyWeight: toNumber(mission.aircraft_empty_weight ?? aircraft.empty_weight),
    loadmasters: toNumber(mission.loadmasters),
    loadmastersFs: toNumber(mission.loadmasters_fs),
    passengers: 0, // TODO: Add passengers field to mission table
    etc: 0, // TODO: Add etc field to mission table
    etcFs: 0, // TODO: Add etcFs field to mission table
    cockpit: 0, // TODO: ??
    safetyGearWeight: toNumber(mission.safety_gear_weight),
    foodWeight: toNumber(mission.food_weight),
    etcWeight: toNumber(mission.etc_weight),
    configurationWeights: toNumber(mission.configuration_weights),
    crewGearWeight: toNumber(mission.crew_gear_weight),
    fuelPods: false,
    fuelDistribution: {
      outbd: toNumber(mission.outboard_fuel),
      inbd: toNumber(mission.inboard_fuel),
      aux: toNumber(mission.auxiliary_fuel),
      ext: toNumber(mission.external_fuel),
      fuselage: toNumber(mission.fuselage_fuel),
    },
    aircraftId: mission.aircraft_id,
    notes: '',
  };
  return result;
}

type AppViewType = 'settings' | 'planning' | 'preview' | 'graphs';

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<AppViewType>('settings');
  const [missionSettings, setMissionSettings] = useState<MissionSettings | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [isLandscape, setIsLandscape] = useState(true);
  const [showNewMissionModal, setShowNewMissionModal] = useState(false);
  const [showLoadMissionModal, setShowLoadMissionModal] = useState(false);
  const [showDuplicateMissionModal, setShowDuplicateMissionModal] = useState(false);
  const [currentMissionId, setCurrentMissionId] = useState<number>(DEFAULT_MISSION_ID);
  const [macPercent, setMacPercent] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState<number | null>(null);
  const [baseWeight, setBaseWeight] = useState<number | null>(null);
  const [fuelWeight, setFuelWeight] = useState<number | null>(null);
  const [cargoWeight, setCargoWeight] = useState<number | null>(null);
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Add item modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItem | null>(null);
  const [savedPresets, setSavedPresets] = useState<CargoItem[]>([]);

  const convertDbCargoTypeToCargoItem = useCallback((dbCargoType: DbCargoType): CargoItem => {
    const cargoTypeId = typeof dbCargoType.id === 'number' ? dbCargoType.id : 1;
    return {
      id: `preset-${dbCargoType.id || Math.random()}`,
      name: dbCargoType.name,
      cargo_type_id: cargoTypeId,
      length: dbCargoType.default_length,
      width: dbCargoType.default_width,
      height: dbCargoType.default_height,
      weight: dbCargoType.default_weight,
      cog: dbCargoType.default_cog || 0,
      fs: 0,
      dock: 'CG',
      status: 'inventory',
      position: { x: -1, y: -1 },
      color: '#4a90e2', // Default blue color for presets
    };
  }, []);

  // Load saved presets from cargo types
  useEffect(() => {
    const fetchCargoTypes = async () => {
      const dbCargoTypes = (await getAllCargoTypes()).results.map(item => item.data) as DbCargoType[];
      const cargoItemsLocal = dbCargoTypes.map(convertDbCargoTypeToCargoItem);
      setSavedPresets(cargoItemsLocal);
    };
    fetchCargoTypes();
  }, [convertDbCargoTypeToCargoItem]);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('Starting database initialization...');
        await initAppDatabase();
        console.log('Database initialization completed successfully');
        setIsDatabaseInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitializationError(error instanceof Error ? error.message : 'Failed to initialize database');
      }
    };

    initDatabase();
  }, []);

  // Load mission data only after database is initialized
  useEffect(() => {
    if (!isDatabaseInitialized) {
      return;
    }

    const loadMissionData = async () => {
      try {
        console.log('Loading mission data for mission ID:', currentMissionId);

        // Load mission settings
        const mission = await getMissionById(currentMissionId);
        if (mission.results.length === 0) {
          throw new Error('Mission not found');
        }
        const settings = await convertDbMissionToMissionSettings(mission.results[0].data as Mission);
        setMissionSettings(settings);

        // Load cargo items
        const cargoResponse = await getCargoItemsByMissionId(currentMissionId);
        const dbCargoItems: DbCargoItem[] = cargoResponse.results.map(item => item?.data as DbCargoItem);
        const convertedItems: CargoItem[] = dbCargoItems.map(convertDbCargoItemToCargoItem);
        setCargoItems(convertedItems);

        console.log('Mission data loaded successfully');
      } catch (error) {
        console.error('Error loading mission data:', error);
      }
    };

    loadMissionData();
  }, [isDatabaseInitialized, currentMissionId]); // Wait for BOTH database init AND mission ID

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };

    updateOrientation();

    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (currentMissionId) {
      (async () => {
        try {
          const mac = await calculateMACPercent(currentMissionId);
          setMacPercent(mac);
          const weight = await calculateTotalAircraftWeight(currentMissionId);
          setTotalWeight(weight);
          const base = await calculateBaseWeight(currentMissionId);
          setBaseWeight(base);
          const fuel = await calculateTotalFuelWeight(currentMissionId);
          setFuelWeight(fuel);
          const cargo = await calculateCargoWeight(currentMissionId);
          setCargoWeight(cargo);
        } catch (e) {
          setMacPercent(null);
          setTotalWeight(null);
          setBaseWeight(null);
          setFuelWeight(null);
          setCargoWeight(null);
        }
      })();
    }
  }, [currentView, currentMissionId, cargoItems, missionSettings]);

  const handleAddItem = useCallback(async (item: CargoItem, status: 'inventory' | 'onStage' | 'onDeck' = 'inventory') => {
    let x_start_position = -1;
    let y_start_position = -1;
    console.log('item', item);
    if (status === 'onDeck') {
      if (item.fs > 0) {
        // item defined in manual cargo insertion or being placed on deck with specific FS
        x_start_position = fsToXPosition(item.fs, item.cog);
        y_start_position = DEFAULT_Y_POS;
      } else {
        // New item being automatically placed on deck - use default position
        // Place at FS 400 (middle of loading area) with item's CG
        const defaultFs = 400;
        x_start_position = fsToXPosition(defaultFs, item.cog);
        y_start_position = DEFAULT_Y_POS;
      }
    }
    let newItem: DbCargoItem = {
      status: status,
      x_start_position: x_start_position,
      y_start_position: y_start_position,
      mission_id: currentMissionId,
      cargo_type_id: item.cargo_type_id,
      name: item.name,
      length: item.length,
      width: item.width,
      height: item.height,
      weight: item.weight,
      cog: item.cog,
      forward_overhang: 0,
      back_overhang: 0,
      color: item.color,
    };
    try {
      const response = await createCargoItem(newItem);
      if (response && response.results && response.results.length > 0) {
        newItem.id = response.results[0].lastInsertId;
        const newItemForState = {
          ...convertDbCargoItemToCargoItem(newItem),
          dock: item.dock || 'CG', // preserve dock from input item
          color: item.color || '#4a90e2', // preserve color from input item
        };
        setCargoItems(prev => [...prev, newItemForState]);
      } else {
        console.error('Failed to add cargo item: Invalid response from createCargoItem', response);
      }
    } catch (error) {
      console.error('Error adding cargo item:', error);
    }
  }, [currentMissionId]);

  const handleEditItem = useCallback((item: CargoItem) => {
    setCargoItems(prev => prev.map(i => {
      if (i.id !== item.id) {return i;}

      let updatedItem = { ...i, ...item };

      // If FS changed, update position.x accordingly
      if (i.fs !== item.fs) {
        updatedItem = updateCargoItemPosition(updatedItem, { ...i.position, x: fsToXPosition(item.fs, item.cog) });
      }
      // If CG changed and item is on deck, update position.x to maintain FS
      else if (i.cog !== item.cog && item.status === 'onDeck') {
        updatedItem = updateCargoItemPosition(updatedItem, { ...i.position, x: fsToXPosition(item.fs, item.cog) });
      }

      updateCargoItem({
        id: parseInt(item.id, 10),
        status: updatedItem.status,
        x_start_position: updatedItem.position.x,
        y_start_position: updatedItem.position.y,
        mission_id: currentMissionId,
        cargo_type_id: updatedItem.cargo_type_id,
        name: updatedItem.name,
        weight: updatedItem.weight,
        length: updatedItem.length,
        width: updatedItem.width,
        height: updatedItem.height,
        forward_overhang: 0,
        back_overhang: 0,
        cog: updatedItem.cog,
        color: updatedItem.color,
      });
      return updatedItem;
    }));
  }, [currentMissionId]);

  const handleDeleteItem = useCallback((id: string) => {
    // Remove from state
    setCargoItems(prev => prev.filter(item => item.id !== id));

    // Also delete from the database
    try {
      deleteCargoItem(parseInt(id, 10));
    } catch (error) {
      console.error('Error deleting cargo item from database:', error);
    }
  }, []);

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
      mission_id: currentMissionId,
      cargo_type_id: itemToDuplicate.cargo_type_id,
      length: itemToDuplicate.length,
      width: itemToDuplicate.width,
      height: itemToDuplicate.height,
      weight: itemToDuplicate.weight,
      cog: itemToDuplicate.cog,
      forward_overhang: 0, // TODO: Add forward overhang
      back_overhang: 0, // TODO: Add back overhang
      color: itemToDuplicate.color,
    };

    try {
      const response = await createCargoItem(newDbItem);
      if (response && response.results && response.results.length > 0) {
        newDbItem.id = response.results[0].lastInsertId;
        const newItemForState = convertDbCargoItemToCargoItem(newDbItem);
        setCargoItems(prev => [...prev, newItemForState]);
      } else {
        console.error('Failed to duplicate item: Invalid response from createCargoItem', response);
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
    }
  }, [cargoItems, currentMissionId]);

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

      updateCargoItem({
        id: parseInt(id, 10),
        status: status as 'onStage' | 'onDeck' | 'inventory',
        x_start_position: newPosition.x,
        y_start_position: newPosition.y,
        mission_id: currentMissionId,
        cargo_type_id: i.cargo_type_id,
        name: i.name,
        weight: i.weight,
        length: i.length,
        width: i.width,
        height: i.height,
        forward_overhang: 0, // TODO: Add forward overhang
        back_overhang: 0, // TODO: Add back overhang
        cog: i.cog,
        color: i.color,
      });

      // Use utility function to update position and sync fs
      const updatedItem = updateCargoItemPosition(i, newPosition);
      // Only keep FS for onDeck items, reset to 0 for others
      const finalFs = status === 'onDeck' ? updatedItem.fs : 0;
      return { ...updatedItem, status, fs: finalFs };
    }));
  }, [currentMissionId]);

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

  const handleRemoveFromDeck = useCallback((id: string) => {
    handleUpdateItemStatus(id, 'inventory');
  }, [handleUpdateItemStatus]);

  const handleMissionSave = useCallback(async (settings: MissionSettings) => {
    setMissionSettings(settings);
    const mission: Mission = {
      id: parseInt(settings.id, 10),
      name: settings.name,
      created_date: settings.date,
      modified_date: new Date().toISOString(),
      loadmasters: settings.loadmasters,
      loadmasters_fs: settings.loadmastersFs,
      configuration_weights: settings.configurationWeights,
      crew_gear_weight: settings.crewGearWeight,
      food_weight: settings.foodWeight,
      safety_gear_weight: settings.safetyGearWeight,
      etc_weight: settings.etcWeight,
      outboard_fuel: settings.fuelDistribution.outbd,
      inboard_fuel: settings.fuelDistribution.inbd,
      fuselage_fuel: settings.fuelDistribution.fuselage,
      auxiliary_fuel: settings.fuelDistribution.aux,
      external_fuel: settings.fuelDistribution.ext,
      aircraft_id: settings.aircraftId,
      aircraft_empty_weight: settings.aircraftEmptyWeight,
    };
    try {
    await updateMission(mission);

      const aircraftResult = await getAircraftById(settings.aircraftId);
      if (aircraftResult.results.length > 0 && aircraftResult.results[0].data) {
        const aircraft = aircraftResult.results[0].data as Aircraft;

        const updatedAircraft: Aircraft = {
          ...aircraft,
          empty_weight: settings.aircraftEmptyWeight,
          empty_mac: settings.aircraftIndex,
        };

        await updateAircraft(updatedAircraft);
      }
    } catch (error) {
      console.error('Error updating mission:', error);
    }
  }, []);

  const handleNewMission = useCallback(async (missionName: string) => {
    try {
      let newMission: Mission = DEFAULT_NEW_MISSION;
      newMission.name = missionName;

      const missionResponse = await createMission(newMission);
      const newMissionId = missionResponse.results[0].lastInsertId as number;

      setCurrentMissionId(newMissionId);
      setCargoItems([]);
      newMission.id = newMissionId;
      const newMissionSettings = await convertDbMissionToMissionSettings(newMission);
      setMissionSettings(newMissionSettings);

      setShowNewMissionModal(false);
      console.log('New mission created:', missionName, 'with ID:', newMissionId);
    } catch (error) {
      console.error('Error creating new mission:', error);
    }
  }, []);

  const handleNewMissionClick = useCallback(() => {
    setShowNewMissionModal(true);
  }, []);

  const handleCancelNewMission = useCallback(() => {
    setShowNewMissionModal(false);
  }, []);

  const handleLoadMission = useCallback(async (mission: Mission) => {
    try {
      setCurrentMissionId(mission.id as number);

      const loadedMissionSettings = await convertDbMissionToMissionSettings(mission);
      setMissionSettings(loadedMissionSettings);

      const cargoResponse = await getCargoItemsByMissionId(mission.id as number);
      const dbCargoItems: DbCargoItem[] = cargoResponse.results.map(item => item?.data as DbCargoItem);
      const convertedItems: CargoItem[] = dbCargoItems.map(convertDbCargoItemToCargoItem);
      setCargoItems(convertedItems);

      setShowLoadMissionModal(false);

      console.log('Mission loaded:', mission.name, 'with ID:', mission.id);
    } catch (error) {
      console.error('Error loading mission:', error);
    }
  }, []);

  const handleLoadMissionClick = useCallback(() => {
    setShowLoadMissionModal(true);
  }, []);

  const handleCancelLoadMission = useCallback(() => {
    setShowLoadMissionModal(false);
  }, []);

  const handleDuplicateMission = useCallback(async (newMissionName: string) => {
    try {
      if (!missionSettings) {
        console.error('No current mission to duplicate');
        return;
      }

      // Create a new mission with the duplicated settings but new name
      const duplicatedMission: Mission = {
        name: newMissionName,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        loadmasters: missionSettings.loadmasters,
        loadmasters_fs: missionSettings.loadmastersFs,
        configuration_weights: missionSettings.configurationWeights,
        crew_gear_weight: missionSettings.crewGearWeight,
        food_weight: missionSettings.foodWeight,
        safety_gear_weight: missionSettings.safetyGearWeight,
        etc_weight: missionSettings.etcWeight,
        outboard_fuel: missionSettings.fuelDistribution.outbd,
        inboard_fuel: missionSettings.fuelDistribution.inbd,
        fuselage_fuel: missionSettings.fuelDistribution.fuselage,
        auxiliary_fuel: missionSettings.fuelDistribution.aux,
        external_fuel: missionSettings.fuelDistribution.ext,
        aircraft_id: missionSettings.aircraftId,
        aircraft_empty_weight: missionSettings.aircraftEmptyWeight,
      };

      // Create the new mission in the database
      const missionResponse = await createMission(duplicatedMission);
      const newMissionId = missionResponse.results[0].lastInsertId as number;

      // Duplicate all cargo items for the new mission
      const duplicatedCargoItems: CargoItem[] = [];
      for (const item of cargoItems) {
        const duplicatedDbItem: DbCargoItem = {
          mission_id: newMissionId,
          cargo_type_id: item.cargo_type_id,
          name: item.name,
          weight: item.weight,
          length: item.length,
          width: item.width,
          height: item.height,
          cog: item.cog,
          x_start_position: item.position.x,
          y_start_position: item.position.y,
          status: item.status,
          forward_overhang: 0,
          back_overhang: 0,
          color: item.color,
        };

        const itemResponse = await createCargoItem(duplicatedDbItem);
        if (itemResponse && itemResponse.results && itemResponse.results.length > 0) {
          duplicatedDbItem.id = itemResponse.results[0].lastInsertId;
          duplicatedCargoItems.push(convertDbCargoItemToCargoItem(duplicatedDbItem));
        }
      }

      // Set the new mission as current
      setCurrentMissionId(newMissionId);
      setCargoItems(duplicatedCargoItems);

      duplicatedMission.id = newMissionId;
      const newMissionSettings = await convertDbMissionToMissionSettings(duplicatedMission);
      setMissionSettings(newMissionSettings);

      setShowDuplicateMissionModal(false);
      console.log('Mission duplicated:', newMissionName, 'with ID:', newMissionId);
    } catch (error) {
      console.error('Error duplicating mission:', error);
    }
  }, [missionSettings, cargoItems]);

  const handleDuplicateMissionClick = useCallback(() => {
    if (!missionSettings) {
      console.error('No Mission', 'Please create or load a mission first.');
      return;
    }
    setShowDuplicateMissionModal(true);
  }, [missionSettings]);

  const handleCancelDuplicateMission = useCallback(() => {
    setShowDuplicateMissionModal(false);
  }, []);

  // Add item modal handlers
  const handleAddItemModal = useCallback(() => {
    setEditingItem(null);
    setIsAddModalVisible(true);
  }, []);

  const handleEditItemModal = useCallback((item: CargoItem) => {
    setEditingItem(item);
    setIsAddModalVisible(true);
  }, []);

  const handleSaveItemModal = useCallback((item: CargoItem) => {
    if (editingItem) {
      handleEditItem(item);
    } else {
      // Automatically place new items on deck
      handleAddItem(item, 'onDeck');
    }
    setIsAddModalVisible(false);
    setEditingItem(null);
  }, [editingItem, handleEditItem, handleAddItem]);

  const handleCancelItemModal = useCallback(() => {
    setIsAddModalVisible(false);
    setEditingItem(null);
  }, []);
  // Show loading screen while database is initializing
  if (!isDatabaseInitialized) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <View style={styles.loadingTextContainer}>
              {initializationError ? (
                <>
                  <Text style={styles.errorText}>Database initialization failed</Text>
                  <Text style={styles.errorDetails}>{initializationError}</Text>
                </>
              ) : (
                <Text style={styles.loadingText}>Initializing database...</Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const views: Record<AppViewType, React.ReactNode> = {
    settings: (
      <MissionSettingsComponent
        settings={missionSettings ?? undefined}
        cargoItems={cargoItems}
        onReturn={() => setCurrentView('planning')}
        onSave={handleMissionSave}
        onAddToMainCargo={handleAddItem}
        onRemoveFromDeck={handleRemoveFromDeck}
        onUpdateItem={handleEditItem}
      />
    ),
    planning: (
      <View style={[styles.planningContainer, isLandscape ? styles.landscapeContainer : null]}>
        <View style={styles.contentContainer}>
          <Sidebar
            items={cargoItems}
            onAddItem={handleAddItemModal}
            onEditItem={handleEditItemModal}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onSaveAsPreset={handleSaveAsPreset}
            onAddToStage={handleAddToStage}
            onRemoveFromStage={handleRemoveFromStage}
          />
          <LoadingArea
            items={cargoItems}
            onUpdateItemStatus={handleUpdateItemStatus}
            onEditItem={handleEditItem}
          />
        </View>
      </View>
    ),
    preview: (
      <Preview
        items={cargoItems}
        missionSettings={missionSettings ?? null}
        macPercent={macPercent}
        totalWeight={totalWeight}
        onReturn={() => setCurrentView('planning')}
      />
    ),
    graphs: (
      <Graphs
        macPercent={macPercent ?? 0}
        weight={totalWeight ?? 0}
        baseWeight={baseWeight ?? 0}
        fuelWeight={fuelWeight ?? 0}
        cargoWeight={cargoWeight ?? 0}
        macGraphImgSrc={Images.mac}
        areaGraphImgSrc={Images.area}
        onBack={() => setCurrentView('planning')}
      />
    ),
  };

  return (
    <Host>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <Header
            currentView={currentView}
            onSettingsClick={() => setCurrentView('settings')}
            onPreviewClick={() => setCurrentView('preview')}
            onNewMissionClick={handleNewMissionClick}
            onLoadMissionClick={handleLoadMissionClick}
            onDuplicateMissionClick={handleDuplicateMissionClick}
            onGraphsClick={() => setCurrentView('graphs')}
            onPlanningClick={() => setCurrentView('planning')}
            macPercent={macPercent}
            totalWeight={totalWeight}
            missionSettings={missionSettings}
          />
          {views[currentView]}
          <NewMissionModal
            visible={showNewMissionModal}
            onSave={handleNewMission}
            onCancel={handleCancelNewMission}
          />
          <LoadMissionModal
            visible={showLoadMissionModal}
            onLoad={handleLoadMission}
            onCancel={handleCancelLoadMission}
          />
          <NewMissionModal
            visible={showDuplicateMissionModal}
            onSave={handleDuplicateMission}
            onCancel={handleCancelDuplicateMission}
            title="Duplicate Mission"
            buttonText="Duplicate"
            placeholder="Enter name for duplicated mission"
          />
          {isAddModalVisible && (
            <AddCargoItemModal
              initialItem={editingItem || undefined}
              onSave={handleSaveItemModal}
              onCancel={handleCancelItemModal}
              savedPresets={savedPresets}
            />
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Host>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default App;
