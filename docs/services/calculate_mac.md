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
 * @param aircraftId - The ID of the aircraft
 * @param totalIndex - The accumulated MAC index from all cargo items
 * @returns The calculated CG value as a float
 */
calculateAircraftCG(aircraftId: number, totalIndex: number): Promise<number>
```

## Database Dependencies

The service relies on the following database tables:
- `mission`: Contains mission details and references to aircraft
- `cargo_item`: Stores cargo placement coordinates and references to cargo types
- `cargo_type`: Defines cargo specifications including weight and dimensions
- `aircraft`: Stores aircraft configuration data including empty weight

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
  
  // 3. Calculate total MAC index
  let totalMACIndex = 0;
  for (const cargoItem of cargoItems) {
    const macIndex = await calculateMACIndex(cargoItem.id);
    totalMACIndex += macIndex;
  }
  
  // 4. Calculate aircraft CG
  const cg = await calculateAircraftCG(mission.aircraft_id, totalMACIndex);
  
  // 5. Calculate MAC percentage
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
  
  // 2. Get associated cargo type
  const cargoType = await getCargoTypeById(cargoItem.cargo_type_id);
  
  // 3. Calculate center point
  const centerX = cargoItem.x_start_position + (cargoType.default_length / 2);
  const centerY = cargoItem.y_start_position + (cargoType.default_width / 2);
  
  // 4. Calculate MAC index
  const index = (centerX - 533.46) * cargoType.default_weight / 50000;
  
  return index;
}
```

#### calculateAircraftCG

```typescript
async function calculateAircraftCG(aircraftId: number, totalIndex: number): Promise<number> {
  // 1. Get aircraft data
  const aircraft = await getAircraftById(aircraftId);
  if (!aircraft) {
    throw new Error(`Aircraft with ID ${aircraftId} not found`);
  }
  
  // 2. Calculate CG
  const cg = (totalIndex - 100) * 50000 / aircraft.empty_weight;
  
  return cg;
}
```

## Error Handling

The service implements the following error handling:

- Validate mission existence before attempting calculations
- Verify all cargo items exist and have valid properties
- Ensure aircraft data is available and valid
- Handle calculation edge cases