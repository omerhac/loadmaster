# Calculat MAC Service Technical Specification

## Overview
The MAC (Mean Aerodynamic Chord) Calculation Service provides functionality to determine the current MAC percentage for aircraft loading operations. This is critical for ensuring proper weight distribution and maintaining aircraft balance during flight operations.

## API

```typescript
/**
 * Calculates the MAC percentage for a given mission
 * @param missionId - The ID of the mission to calculate MAC for
 * @returns The current MAC percentage as a float
 */
calculateMACPercent(missionId: number): Promise<number>

/**
 * Calculates the MAC index for a single cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The MAC index as a float
 */
calculateMACIndex(cargoItemId: number): Promise<number>

/**
 * Calculates the aircraft Center of Gravity (CG)
 * @param missionId - The Mission Id to calculate the CG for
 * @param totalIndex - The accumulated MAC index from all cargo items
 * @returns The calculated CG value as a float
 */
calculateAircraftCG(missionID: number, totalIndex: number): Promise<number>

/**
 * Calculates the MAC contribution from additional weights (crew, food, etc.)
 * @param missionId - The ID of the mission
 * @returns The MAC index contribution from additional weights
 */
calculateAdditionalWeightsMACIndex(missionId: number): Promise<number>

/**
 * Calculates the total aircraft weight including all cargo, fuel, and additional weights
 * @param missionId - The ID of the mission
 * @returns The total weight of the aircraft in pounds
 */
calculateTotalAircraftWeight(missionId: number): Promise<number>

/**
 * Calculates the MAC contribution from the fuel configuration
 * @param missionId - The ID of the mission
 * @returns The MAC index contribution from fuel
 */
calculateFuelMAC(missionId: number): Promise<number>
```

## Database Dependencies

The service relies on the following database tables:
- `mission`: Contains mission details and references to aircraft
- `cargo_item`: Stores cargo placement coordinates and references to cargo types
- `cargo_type`: Defines cargo specifications including weight and dimensions
- `aircraft`: Stores aircraft configuration data including empty weight
- `fuel_state`: Contains fuel load information for the mission
- `fuel_mac_quants`: Reference table with MAC contributions for different fuel configurations

## Implementation Details

### Main Function: calculateMACPercent

```typescript
async function calculateMACPercent(missionId: number): Promise<number> {
  // 1. Validate and retrieve mission
  const mission = await getMissionById(missionId);
  if (!mission) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }
  
  // 2. Get all cargo items for this mission
  const cargoItems = await getCargoItemsByMissionId(missionId);
  
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
```

### Helper Functions

#### calculateMACIndex

```typescript
async function calculateMACIndex(cargoItemId: number): Promise<number> {
  // 1. Get cargo item data
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Calculate center point using cargo item's dimensions
  const centerX = cargoItem.x_start_position + (cargoItem.length / 2);
  const centerY = cargoItem.y_start_position + (cargoItem.width / 2);
  
  // 3. Calculate MAC index using cargo item's weight
  const index = (centerX - 533.46) * cargoItem.weight / 50000;
  
  return index;
}
```

#### calculateAircraftCG

```typescript
async function calculateAircraftCG(missionId: number, totalIndex: number): Promise<number> {
  // 1. Calculate total aircraft weight
  const totalWeight = await calculateTotalAircraftWeight(missionId);
  
  // 2. Calculate CG
  const cg = (totalIndex - 100) * 50000 / totalWeight;
  
  return cg;
}
```

#### calculateAdditionalWeightsMAC

```typescript
async function calculateAdditionalWeightsMACIndex(missionId: number): Promise<number> {
  // 1. Get mission data
  const mission = await getMissionById(missionId);
  if (!mission) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }
  
  // 2. Define standard locations for different weight types
  // These are the x-coordinates (stations) where these weights are typically located
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
```

#### calculateTotalAircraftWeight

```typescript
async function calculateTotalAircraftWeight(missionId: number): Promise<number> {
  // 1. Get mission data
  const mission = await getMissionById(missionId);
  if (!mission) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }
  
  // 2. Get aircraft data
  const aircraft = await getAircraftById(mission.aircraft_id);
  if (!aircraft) {
    throw new Error(`Aircraft with ID ${mission.aircraft_id} not found`);
  }
  
  // 3. Get all cargo items for this mission
  const cargoItems = await getCargoItemsByMissionId(missionId);
  
  // 4. Calculate total cargo weight using each cargo item's own weight
  let totalCargoWeight = 0;
  for (const cargoItem of cargoItems) {
    totalCargoWeight += cargoItem.weight;
  }
  
  // 5. Get fuel data
  const fuelState = await getFuelStateByMissionId(missionId);
  const totalFuelWeight = fuelState ? fuelState.total_fuel : 0;
  
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
```

#### calculateFuelMAC

```typescript
async function calculateFuelMAC(missionId: number): Promise<number> {
  // 1. Get fuel state for the mission
  const fuelState = await getFuelStateByMissionId(missionId);
  if (!fuelState) {
    // If no fuel state exists, return 0 as the MAC contribution
    return 0;
  }
  
  // 2. Find the most closely matching fuel configuration in the reference table
  const fuelMacQuant = await findClosestFuelMacConfiguration(
    fuelState.main_tank_1_fuel,
    fuelState.main_tank_2_fuel,
    fuelState.main_tank_3_fuel,
    fuelState.main_tank_4_fuel,
    fuelState.external_1_fuel,
    fuelState.external_2_fuel
  );
  
  // 3. Return the MAC contribution from the reference table
  // If an exact match isn't found, we return the closest match's MAC contribution
  return fuelMacQuant.mac_contribution;
}
```

## Error Handling

The service implements the following error handling:

- Validate mission existence before attempting calculations
- Verify all cargo items exist and have valid properties
- Ensure aircraft data is available and valid
- Handle calculation edge cases