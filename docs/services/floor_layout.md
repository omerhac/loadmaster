# Floor Layout Service Technical Specification

## Overview
The Floor Layout Service provides functionality to determine cargo positioning, wheel touchpoints, and compartment allocations for aircraft loading operations. This is critical for proper weight distribution, ensuring cargo is positioned correctly on the aircraft floor, and validating that wheel touchpoints align with treadways.

## Requirements

1. **Cargo Spatial Positioning**
   - Calculate the exact coordinates of all four corners of any cargo item
   - Provide accurate position data for loading visualization and validation

2. **Wheel Touchpoint Calculation**
   - Determine floor contact points for different cargo configurations:
     - Four-wheeled cargo items (e.g., vehicles, pallets with casters)
     - Two-wheeled cargo items (e.g., trailers, carts)
     - Bulk cargo items using outer corner contacts

3. **Floor Contact Analysis**
   - Calculate the exact span where a wheel contacts the floor
   - Determine width of contact area based on wheel dimensions

4. **Treadway Position Validation**
   - Verify if wheel touchpoints align with aircraft treadways
   - Implement 50% coverage rule (wheel must have at least 50% width on treadway)

5. **Compartment Assignment**
   - Identify which aircraft compartments contain each cargo touchpoint
   - For bulk items, determine all compartments spanned by the cargo

## API

```typescript
/**
 * Calculates the four corner coordinates of a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns An array of points representing the four corners [frontLeft, frontRight, backLeft, backRight]
 */
getCargoCorners(cargoItemId: number): Promise<Point[]>

/**
 * Calculates the wheel touchpoint coordinates for a specific cargo item
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel configuration type ('four-wheel', 'two-wheel', or 'bulk')
 * @returns An array of points representing wheel touchpoints or corner contacts
 */
getWheelTouchpoints(cargoItemId: number, wheelType: 'four-wheel' | 'two-wheel' | 'bulk'): Promise<Point[]>

/**
 * Calculates the span of a wheel's contact with the floor along the y-axis
 * @param x - The x-coordinate of the wheel's center
 * @param y - The y-coordinate of the wheel's center
 * @param wheelWidth - The width of the wheel in inches
 * @returns The start and end y-coordinates of the wheel's contact with the floor
 */
getWheelContactSpan(x: number, y: number, wheelWidth: number): Promise<WheelSpan>

/**
 * Determines if a wheel touchpoint is positioned on a treadway
 * @param ySpan - The y-axis span of the wheel's contact with the floor
 * @param aircraftId - The ID of the aircraft to check treadway positions
 * @returns True if at least 50% of the wheel width is on a treadway, false otherwise
 */
isTouchpointOnTreadway(ySpan: WheelSpan, aircraftId: number): Promise<boolean>

/**
 * Identifies which compartments a cargo item's touchpoints are located in
 * @param cargoItemId - The ID of the cargo item
 * @param touchpointType - The type of touchpoints to check ('four-wheel', 'two-wheel', or 'bulk')
 * @returns An array of compartment objects containing the compartment details
 */
getTouchpointCompartments(cargoItemId: number, touchpointType: 'four-wheel' | 'two-wheel' | 'bulk'): Promise<Compartment[]>
```

## Database Dependencies

The service relies on the following database tables:
- `compartment`: Stores aircraft compartment data with x_start and x_end coordinates
- `cargo_item`: Stores cargo dimensions, position, and properties
- `aircraft`: Stores aircraft specifications including treadway properties

## Implementation Details

### Main Functions

#### getCargoCorners

```typescript
async function getCargoCorners(cargoItemId: number): Promise<Point[]> {
  // 1. Validate and retrieve cargo item
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Extract cargo dimensions and position
  const { x_start_position, y_start_position, length, width } = cargoItem;
  
  // 3. Calculate the coordinates for all four corners
  const frontLeft: Point = { 
    x: x_start_position, 
    y: y_start_position 
  };
  
  const frontRight: Point = { 
    x: x_start_position, 
    y: y_start_position + width 
  };
  
  const backLeft: Point = { 
    x: x_start_position + length, 
    y: y_start_position 
  };
  
  const backRight: Point = { 
    x: x_start_position + length, 
    y: y_start_position + width 
  };
  
  // 4. Return the corners in a consistent order
  return [frontLeft, frontRight, backLeft, backRight];
}
```

#### getWheelTouchpoints

```typescript
async function getWheelTouchpoints(
  cargoItemId: number, 
  wheelType: 'four-wheel' | 'two-wheel' | 'bulk'
): Promise<Point[]> {
  // 1. Validate and retrieve cargo item
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Extract cargo dimensions and position
  const { x_start_position, y_start_position, length, width, forward_overhang, back_overhang } = cargoItem;
  
  // 3. Calculate touchpoints based on wheel type
  switch (wheelType) {
    case 'four-wheel': {
      // Typically 20% inset from edges for four-wheeled items
      const insetX = length * 0.2;
      const insetY = width * 0.1;
      
      return [
        { x: x_start_position + insetX, y: y_start_position + insetY },
        { x: x_start_position + insetX, y: y_start_position + width - insetY },
        { x: x_start_position + length - insetX, y: y_start_position + insetY },
        { x: x_start_position + length - insetX, y: y_start_position + width - insetY }
      ];
    }
    
    case 'two-wheel': {
      // Typically at center for two-wheeled items
      const wheelX = x_start_position + length * 0.6; // Slightly back from center
      
      return [
        { x: wheelX, y: y_start_position + width * 0.1 },
        { x: wheelX, y: y_start_position + width * 0.9 }
      ];
    }
    
    case 'bulk': {
      // Bulk items use the corner points
      return [
        { x: x_start_position, y: y_start_position },
        { x: x_start_position, y: y_start_position + width },
        { x: x_start_position + length, y: y_start_position },
        { x: x_start_position + length, y: y_start_position + width }
      ];
    }
    
    default:
      throw new Error(`Invalid wheel type: ${wheelType}`);
  }
}
```

#### getWheelContactSpan

```typescript
async function getWheelContactSpan(
  x: number, 
  y: number, 
  wheelWidth: number
): Promise<WheelSpan> {
  // 1. Calculate the span of the wheel's contact with the floor
  const halfWidth = wheelWidth / 2;
  
  // 2. Return the start and end y-coordinates
  return {
    yStart: y - halfWidth,
    yEnd: y + halfWidth
  };
}
```

#### isTouchpointOnTreadway

```typescript
async function isTouchpointOnTreadway(
  ySpan: WheelSpan, 
  aircraftId: number
): Promise<boolean> {
  // 1. Retrieve aircraft data
  const aircraft = await getAircraftById(aircraftId);
  if (!aircraft) {
    throw new Error(`Aircraft with ID ${aircraftId} not found`);
  }
  
  // 2. Extract treadway information
  const { treadways_width, treadways_dist_from_center } = aircraft;
  
  // 3. Calculate treadway boundaries
  const leftTreadwayStart = -treadways_dist_from_center - treadways_width / 2;
  const leftTreadwayEnd = -treadways_dist_from_center + treadways_width / 2;
  
  const rightTreadwayStart = treadways_dist_from_center - treadways_width / 2;
  const rightTreadwayEnd = treadways_dist_from_center + treadways_width / 2;
  
  // 4. Calculate wheel width and overlap with treadways
  const wheelWidth = ySpan.yEnd - ySpan.yStart;
  
  // Check left treadway overlap
  const leftOverlap = Math.min(ySpan.yEnd, leftTreadwayEnd) - Math.max(ySpan.yStart, leftTreadwayStart);
  const leftOverlapPercentage = leftOverlap > 0 ? leftOverlap / wheelWidth : 0;
  
  // Check right treadway overlap
  const rightOverlap = Math.min(ySpan.yEnd, rightTreadwayEnd) - Math.max(ySpan.yStart, rightTreadwayStart);
  const rightOverlapPercentage = rightOverlap > 0 ? rightOverlap / wheelWidth : 0;
  
  // 5. Return true if at least 50% of the wheel is on either treadway
  return leftOverlapPercentage >= 0.5 || rightOverlapPercentage >= 0.5;
}
```

#### getTouchpointCompartments

```typescript
async function getTouchpointCompartments(
  cargoItemId: number, 
  touchpointType: 'four-wheel' | 'two-wheel' | 'bulk'
): Promise<Compartment[]> {
  // 1. Get cargo item data
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Get aircraft ID from the mission
  const mission = await getMissionById(cargoItem.mission_id);
  if (!mission) {
    throw new Error(`Mission with ID ${cargoItem.mission_id} not found`);
  }
  
  // 3. Get all compartments for the aircraft
  const compartments = await getCompartmentsByAircraftId(mission.aircraft_id);
  
  // 4. Get touchpoints based on the type
  const touchpoints = await getWheelTouchpoints(cargoItemId, touchpointType);
  
  // 5. Identify which compartments contain each touchpoint
  const result: Compartment[] = [];
  
  if (touchpointType === 'bulk') {
    // For bulk items, find all compartments that overlap with the cargo's x-span
    const { x_start_position, length } = cargoItem;
    const x_end_position = x_start_position + length;
    
    for (const compartment of compartments) {
      // Check if the cargo x-span overlaps with the compartment
      if (x_start_position < compartment.x_end && x_end_position > compartment.x_start) {
        result.push(compartment);
      }
    }
  } else {
    // For wheeled items, check each touchpoint
    for (const point of touchpoints) {
      for (const compartment of compartments) {
        if (point.x >= compartment.x_start && point.x <= compartment.x_end) {
          // Only add compartment if it's not already in the result
          if (!result.some(comp => comp.id === compartment.id)) {
            result.push(compartment);
          }
        }
      }
    }
  }
  
  return result;
}
```

## Data Types

```typescript
/**
 * Represents a point in 2D space
 */
interface Point {
  x: number;  // X-coordinate (longitudinal position in the aircraft)
  y: number;  // Y-coordinate (lateral position in the aircraft)
}

/**
 * Represents an aircraft compartment
 */
interface Compartment {
  id: number;       // Unique identifier for the compartment
  name: string;     // Name of the compartment (e.g., "Forward Cargo")
  x_start: number;  // Starting X-coordinate of the compartment
  x_end: number;    // Ending X-coordinate of the compartment
  floor_area: number; // Floor area of the compartment in square inches
  usable_volume: number; // Usable volume of the compartment in cubic inches
}

/**
 * Represents the span of a wheel's contact with the floor
 */
interface WheelSpan {
  yStart: number;  // Starting Y-coordinate of the wheel's contact
  yEnd: number;    // Ending Y-coordinate of the wheel's contact
}
```

## Error Handling

The service implements the following error handling:

- Validate cargo item existence before attempting calculations
- Ensure aircraft data is available and valid for treadway calculations
- Handle calculation edge cases for compartment assignment
- Properly validate input parameters for all functions
- Return specific error messages for different failure cases