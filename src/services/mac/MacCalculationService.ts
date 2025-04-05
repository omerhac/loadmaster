/**
 * MAC Calculation Service
 * 
 * Provides functionality to calculate the Mean Aerodynamic Chord (MAC) percentage
 * for aircraft loading operations, which is critical for ensuring proper weight
 * distribution and maintaining aircraft balance during flight.
 */

import { 
  getMissionById, 
  getCargoItemsByMissionId, 
  getCargoItemById,
  getAircraftById,
  getFuelStateByMissionId
} from '@/services/db/operations';


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
  
  // 2. Get all cargo items for this mission
  const cargoItemsResult = await getCargoItemsByMissionId(missionId);
  const cargoItems = cargoItemsResult.results.map(result => result.data);
  
  // 3. Calculate total MAC index from cargo items
  let totalMACIndex = 0;
  for (const cargoItem of cargoItems) {
    const macIndex = await calculateMACIndex(cargoItem.id);
    totalMACIndex += macIndex;
  }

  // 4. Add MAC index contribution from additional weights
  const additionalWeightsMACIndex = await calculateAdditionalWeightsMACIndex(missionId);
  totalMACIndex += additionalWeightsMACIndex;
  
  // 5. Add MAC index contribution from fuel
  const fuelMACIndex = await calculateFuelMAC(missionId);
  totalMACIndex += fuelMACIndex;

  // 6. Calculate aircraft CG
  const cg = await calculateAircraftCG(missionId, totalMACIndex);
  
  // 7. Calculate MAC percentage
  const macPercent = (cg - 487.4) * 100 / 164.5;
  
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
  
  // 2. Calculate center point using cargo item's dimensions
  const centerX = cargoItem.x_start_position + (cargoItem.length / 2);
  const centerY = cargoItem.y_start_position + (cargoItem.width / 2);
  
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
  // 1. Get total weight
  const totalWeight = await calculateTotalAircraftWeight(missionId);
  
  // 2. Calculate CG using the exact formula from the spec
  const cg = (totalIndex - 100) * 50000 / totalWeight;
  
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
  
  // 2. Define standard locations for different weight types
  // These are the x-coordinates (stations) where these weights are typically located
  // TODO: Update those values according to the TO
  const CREW_STATION = 450.0;
  const CONFIG_STATION = 500.0;
  const CREW_GEAR_STATION = 520.0;
  const FOOD_STATION = 480.0;
  const SAFETY_GEAR_STATION = 510.0;
  const ETC_STATION = 490.0;
  
  // 3. Calculate MAC index contributions for each weight type
  let totalAdditionalMAC = 0;
  
  // Crew weight
  totalAdditionalMAC += (CREW_STATION - 533.46) * mission.crew_weight / 50000;
  
  // Configuration weights
  totalAdditionalMAC += (CONFIG_STATION - 533.46) * mission.configuration_weights / 50000;
  
  // Crew gear weight
  totalAdditionalMAC += (CREW_GEAR_STATION - 533.46) * mission.crew_gear_weight / 50000;
  
  // Food weight
  totalAdditionalMAC += (FOOD_STATION - 533.46) * mission.food_weight / 50000;
  
  // Safety gear weight
  totalAdditionalMAC += (SAFETY_GEAR_STATION - 533.46) * mission.safety_gear_weight / 50000;
  
  // ETC weight
  totalAdditionalMAC += (ETC_STATION - 533.46) * mission.etc_weight / 50000;
  
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
  
  // 2. Get aircraft data
  const aircraftResult = await getAircraftById(mission.aircraft_id);
  if (aircraftResult.count === 0) {
    throw new Error(`Aircraft with ID ${mission.aircraft_id} not found`);
  }
  
  const aircraft = aircraftResult.results[0].data;
  
  // 3. Get all cargo items for this mission
  const cargoItemsResult = await getCargoItemsByMissionId(missionId);
  const cargoItems = cargoItemsResult.results.map(result => result.data);
  
  // 4. Calculate total cargo weight using each cargo item's own weight
  let totalCargoWeight = 0;
  for (const cargoItem of cargoItems) {
    totalCargoWeight += cargoItem.weight;
  }
  
  // 5. Get fuel data
  const fuelStateResult = await getFuelStateByMissionId(missionId);
  const totalFuelWeight = fuelStateResult.count > 0 ? fuelStateResult.results[0].data.total_fuel : 0;
  
  // 6. Sum all weights to get gross weight
  const grossWeight = aircraft.empty_weight + 
                      mission.crew_weight + 
                      mission.configuration_weights + 
                      mission.crew_gear_weight + 
                      mission.food_weight + 
                      mission.safety_gear_weight + 
                      mission.etc_weight +
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
  // 1. Get fuel state for the mission
  const fuelStateResult = await getFuelStateByMissionId(missionId);
  if (fuelStateResult.count === 0) {
    // If no fuel state exists, return 0 as the MAC contribution
    return 0;
  }
  
  const fuelState = fuelStateResult.results[0].data;
  
  // 2. Find the most closely matching fuel configuration in the reference table
  const fuelMacQuantResult = await findClosestFuelMacConfiguration(
    fuelState.main_tank_1_fuel,
    fuelState.main_tank_2_fuel,
    fuelState.main_tank_3_fuel,
    fuelState.main_tank_4_fuel,
    fuelState.external_1_fuel,
    fuelState.external_2_fuel
  );
  
  // 3. Return the MAC contribution from the reference table
  return fuelMacQuantResult.mac_contribution;
}

/**
 * Finds the closest matching fuel configuration in the reference table
 */
async function findClosestFuelMacConfiguration(
  tank1: number,
  tank2: number,
  tank3: number,
  tank4: number,
  ext1: number,
  ext2: number
): Promise<any> {
  // For now, as a simplified implementation, we'll return a fixed MAC contribution
  // In a real implementation, this would query the fuel_mac_quants table to find the closest match
  return {
    mac_contribution: ((tank1 + tank2 + tank3 + tank4 + ext1 + ext2) / 10000) * 0.5
  };
}