/**
 * MAC Calculation Service
 *
 * Provides functionality to calculate the Mean Aerodynamic Chord (MAC) percentage
 * for aircraft loading operations, which is critical for ensuring proper weight
 * distribution and maintaining aircraft balance during flight.
 */

import {
  getMissionById,
  getOnDeckCargoItemsByMissionId,
  getCargoItemById,
  getAircraftById,
} from '../db/operations';
import { DEFAULT_LOADMASTER_WEIGHT, TAXI_FUEL_WEIGHT } from '../../constants';

/**
 * Calculates the total weight of loadmasters
 * @param loadmastersCount - The number of loadmasters
 * @returns The total weight of loadmasters in pounds
 */
export function calculateLoadmastersWeight(loadmastersCount: number): number {
  return loadmastersCount * DEFAULT_LOADMASTER_WEIGHT;
}

/**
 * Calculates the MAC index contribution from loadmasters
 * @param missionId - The ID of the mission
 * @returns The MAC index contribution from loadmasters
 */
export async function calculateLoadmastersIndex(missionId: number): Promise<number> {
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  const loadmastersWeight = calculateLoadmastersWeight(mission.loadmasters);
  const loadmastersIndex = (mission.loadmasters_fs - 533.46) * loadmastersWeight / 50000;

  return loadmastersIndex;
}

/**
 * Calculates the MAC percentage for a given mission
 * @param missionId - The ID of the mission to calculate MAC for
 * @returns The current MAC percentage as a float
 */
export async function calculateMACPercent(missionId: number): Promise<number> {
  // 1. Validate and retrieve mission
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  // 2. Calculate total MAC index from all contributions
  const [cargoMACIndex, additionalWeightsMACIndex, fuelMACIndex, emptyMACIndex] = await Promise.all([
    calculateCargoMACIndex(missionId),
    calculateAdditionalWeightsMACIndex(missionId),
    calculateFuelMAC(missionId),
    getEmptyAircraftMACIndex(mission.aircraft_id),
  ]);

  const totalMACIndex = cargoMACIndex + additionalWeightsMACIndex + fuelMACIndex + emptyMACIndex;

  // 3. Calculate aircraft CG
  const cg = await calculateAircraftCG(missionId, totalMACIndex);

  // 4. Calculate MAC percentage using constants
  // NOTE: These constants may need to be calibrated based on actual aircraft specifications
  const MAC_DATUM = 487.4; // MAC datum station
  const MAC_LENGTH = 164.5; // MAC length

  const macPercent = (cg - MAC_DATUM) * 100 / MAC_LENGTH;

  return macPercent;
}

/**
 * Calculates the MAC index for a single cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The MAC index as a float
 */
export async function calculateMACIndex(cargoItemId: number): Promise<number> {
  // 1. Get cargo item data
  const cargoItemResult = await getCargoItemById(cargoItemId);
  if (cargoItemResult.count === 0) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }

  const cargoItem = cargoItemResult.results[0].data;
  if (!cargoItem) {
    throw new Error(`Cargo item data is undefined for ID ${cargoItemId}`);
  }

  // 2. Calculate center point using cargo item's dimensions
  const centerX = cargoItem.x_start_position + (cargoItem.length / 2);

  // 3. Calculate MAC index using the exact formula from the spec
  const index = (centerX - 533.46) * cargoItem.weight / 50000;

  return index;
}

/**
 * Calculates the aircraft Center of Gravity (CG)
 * @param missionId - The ID of the mission
 * @param totalIndex - The accumulated MAC index from all cargo items
 * @returns The calculated CG value as a float
 */
export async function calculateAircraftCG(missionId: number, totalIndex: number): Promise<number> {
  const totalWeight = await calculateTotalAircraftWeight(missionId);

  // 3. Calculate CG using the exact formula from the spec
  const cg = (totalIndex - 100) * 50000 / totalWeight + 533.46;

  return cg;
}

/**
 * Calculates the MAC contribution from additional weights (crew, food, etc.)
 * @param missionId - The ID of the mission
 * @returns The MAC index contribution from additional weights
 */
export async function calculateAdditionalWeightsMACIndex(missionId: number): Promise<number> {
  // 1. Get mission data
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  // 2. Define standard locations for different weight types
  // These are the x-coordinates (stations) where these weights are typically located
  // TODO: Update those values according to the TO
  const CONFIG_STATION = 500.0;
  const CREW_GEAR_STATION = 520.0;
  const FOOD_STATION = 480.0;
  const SAFETY_GEAR_STATION = 733.46;
  const ETC_STATION = 580.54;

  // 3. Calculate MAC index contributions for each weight type
  let totalAdditionalMAC = 0;

  // Loadmasters index - use the dedicated function
  const loadmastersIndex = await calculateLoadmastersIndex(missionId);
  totalAdditionalMAC += loadmastersIndex;

  // Configuration weights
  const configuration_index = (CONFIG_STATION - 533.46) * mission.configuration_weights / 50000;
  totalAdditionalMAC += configuration_index;

  // Crew gear weight
  const crew_gear_index = (CREW_GEAR_STATION - 533.46) * mission.crew_gear_weight / 50000;
  totalAdditionalMAC += crew_gear_index;

  // Food weight
  const food_index = (FOOD_STATION - 533.46) * mission.food_weight / 50000;
  totalAdditionalMAC += food_index;

  // Safety gear weight
  const safety_gear_index = (SAFETY_GEAR_STATION - 533.46) * mission.safety_gear_weight / 50000;
  totalAdditionalMAC += safety_gear_index;

  // ETC weight
  const etc_index = (ETC_STATION - 533.46) * mission.etc_weight / 50000;
  totalAdditionalMAC += etc_index;

  return totalAdditionalMAC;
}

/**
 * Calculates the total aircraft weight including all cargo, fuel, and additional weights
 * @param missionId - The ID of the mission
 * @returns The total weight of the aircraft in pounds
 */
export async function calculateTotalAircraftWeight(missionId: number): Promise<number> {
  // 1. Get mission data
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  // 2. Get aircraft data
  const aircraftResult = await getAircraftById(mission.aircraft_id);
  if (aircraftResult.count === 0) {
    throw new Error(`Aircraft with ID ${mission.aircraft_id} not found`);
  }

  const aircraft = aircraftResult.results[0].data;
  if (!aircraft) {
    throw new Error(`Aircraft data is undefined for ID ${mission.aircraft_id}`);
  }

  // 3. Get all cargo items for this mission
  const cargoItemsResult = await getOnDeckCargoItemsByMissionId(missionId);
  const cargoItems = cargoItemsResult.results.map(result => result.data).filter(Boolean);

  // 4. Calculate total cargo weight using each cargo item's own weight
  let totalCargoWeight = 0;
  for (const cargoItem of cargoItems) {
    if (cargoItem && cargoItem.weight !== undefined) {
      totalCargoWeight += cargoItem.weight;
    }
  }

  // 5. Calculate total fuel weight from mission fuel fields
  // TODO: enable passing the taxi fuel weight as a parameter
  const totalFuelWeight = mission.outboard_fuel + mission.inboard_fuel +
                         mission.fuselage_fuel + mission.auxiliary_fuel +
                         mission.external_fuel - TAXI_FUEL_WEIGHT;

  // 6. Sum all weights to get gross weight
  const loadmastersWeight = calculateLoadmastersWeight(mission.loadmasters);
  const grossWeight = aircraft.empty_weight +
                      loadmastersWeight +
                      mission.configuration_weights +
                      mission.crew_gear_weight +
                      mission.food_weight +
                      mission.safety_gear_weight +
                      mission.etc_weight  +
                      totalCargoWeight +
                      totalFuelWeight;

  return grossWeight;
}

/**
 * Calculates the MAC contribution from the fuel configuration
 * @param missionId - The ID of the mission
 * @returns The MAC index contribution from fuel
 */
export async function calculateFuelMAC(missionId: number): Promise<number> {
  // 1. Get mission data to access fuel fields
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  // 2. Calculate MAC contributions using the provided formulas
  const outboardMAC = (545 - 533.46) * mission.outboard_fuel / 50000;
  const inboardMAC = (554 - 533.46) * mission.inboard_fuel / 50000;
  const auxiliaryMAC = (557 - 533.46) * mission.auxiliary_fuel / 50000;
  const externalMAC = (552 - 533.46) * mission.external_fuel / 50000;
  const fuselageMAC = (545 - 533.46) * mission.fuselage_fuel / 50000;

  // 3. Sum all fuel MAC contributions
  const totalFuelMAC = outboardMAC + inboardMAC + auxiliaryMAC + externalMAC + fuselageMAC;

  return totalFuelMAC;
}

/**
 * Retrieves the empty MAC index value for an aircraft from the database
 * @param aircraftId - The ID of the aircraft
 * @returns The empty MAC index of the aircraft
 */
export async function getEmptyAircraftMACIndex(aircraftId: number): Promise<number> {
  // 1. Get aircraft data from the database
  const aircraftResult = await getAircraftById(aircraftId);
  if (aircraftResult.count === 0) {
    throw new Error(`Aircraft with ID ${aircraftId} not found`);
  }

  const aircraft = aircraftResult.results[0].data;
  if (!aircraft) {
    throw new Error(`Aircraft data is undefined for ID ${aircraftId}`);
  }

  // 2. Return the empty MAC index from the aircraft record
  if (aircraft.empty_mac === undefined || aircraft.empty_mac === null) {
    throw new Error(`Empty MAC index not defined for aircraft with ID ${aircraftId}`);
  }

  return aircraft.empty_mac;
}

/**
 * Calculates the base weight (empty weight + configuration + crew + gear + food + safety + etc)
 * @param missionId - The ID of the mission
 * @returns The base weight in pounds
 */
export async function calculateBaseWeight(missionId: number): Promise<number> {
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  const aircraftResult = await getAircraftById(mission.aircraft_id);
  if (aircraftResult.count === 0) {
    throw new Error(`Aircraft with ID ${mission.aircraft_id} not found`);
  }

  const aircraft = aircraftResult.results[0].data;
  if (!aircraft) {
    throw new Error(`Aircraft data is undefined for ID ${mission.aircraft_id}`);
  }

  const loadmastersWeight = calculateLoadmastersWeight(mission.loadmasters);
  const baseWeight = aircraft.empty_weight +
                    mission.configuration_weights +
                    loadmastersWeight +
                    mission.crew_gear_weight +
                    mission.food_weight +
                    mission.safety_gear_weight +
                    mission.etc_weight;

  return baseWeight;
}

/**
 * Calculates the total fuel weight from mission fuel fields
 * @param missionId - The ID of the mission
 * @returns The total fuel weight in pounds
 */
export async function calculateTotalFuelWeight(missionId: number): Promise<number> {
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  const totalFuelWeight = mission.outboard_fuel + mission.inboard_fuel +
                         mission.fuselage_fuel + mission.auxiliary_fuel +
                         mission.external_fuel;

  return totalFuelWeight;
}

/**
 * Calculates the total cargo weight for a mission
 * @param missionId - The ID of the mission
 * @returns The total cargo weight in pounds
 */
export async function calculateCargoWeight(missionId: number): Promise<number> {
  const cargoItemsResult = await getOnDeckCargoItemsByMissionId(missionId);
  const cargoItems = cargoItemsResult.results.map(result => result.data).filter(Boolean);

  let totalCargoWeight = 0;
  for (const cargoItem of cargoItems) {
    if (cargoItem && cargoItem.weight !== undefined) {
      totalCargoWeight += cargoItem.weight;
    }
  }

  return totalCargoWeight;
}

/**
 * Calculates the total MAC index from all cargo items
 * @param missionId - The ID of the mission
 * @returns The total cargo MAC index
 */
export async function calculateCargoMACIndex(missionId: number): Promise<number> {
  const cargoItemsResult = await getOnDeckCargoItemsByMissionId(missionId);
  const cargoItems = cargoItemsResult.results.map(result => result.data).filter(Boolean);

  let totalCargoMACIndex = 0;
  for (const cargoItem of cargoItems) {
    if (cargoItem && cargoItem.id) {
      const macIndex = await calculateMACIndex(cargoItem.id);
      totalCargoMACIndex += macIndex;
    }
  }

  return totalCargoMACIndex;
}

/**
 * Calculates the total MAC index (sum of all index contributions)
 * @param missionId - The ID of the mission
 * @returns The total MAC index
 */
export async function calculateTotalIndex(missionId: number): Promise<number> {
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const mission = missionResult.results[0].data;
  if (!mission) {
    throw new Error(`Mission data is undefined for mission ID ${missionId}`);
  }

  const [cargoMACIndex, fuelMACIndex, additionalWeightsMACIndex, emptyAircraftMACIndex] = await Promise.all([
    calculateCargoMACIndex(missionId),
    calculateFuelMAC(missionId),
    calculateAdditionalWeightsMACIndex(missionId),
    getEmptyAircraftMACIndex(mission.aircraft_id),
  ]);

  return cargoMACIndex + fuelMACIndex + additionalWeightsMACIndex + emptyAircraftMACIndex;
}

/**
 * Calculates the zero fuel weight (total weight minus fuel)
 * @param missionId - The ID of the mission
 * @returns The zero fuel weight in pounds
 */
export async function calculateZeroFuelWeight(missionId: number): Promise<number> {
  const [totalWeight, totalFuelWeight] = await Promise.all([
    calculateTotalAircraftWeight(missionId),
    calculateTotalFuelWeight(missionId),
  ]);

  // Subtract taxi fuel that was already subtracted in total weight
  return totalWeight - totalFuelWeight + TAXI_FUEL_WEIGHT;
}
