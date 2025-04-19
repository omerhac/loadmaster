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

3. **Wheel Contact Analysis**
   - Calculate whether wheels are positioned on treadways
   - Calculate the wheel span that contacts the floor

4. **Compartment Position Determination**
   - Identify which compartments contain each wheel touchpoint
   - Determine overlapping compartments for a cargo item

## Type Definitions

```typescript
/**
 * Touchpoint position identifiers
 */
export enum TouchpointPosition {
  FrontLeft = 'frontLeft',
  FrontRight = 'frontRight',
  BackLeft = 'backLeft',
  BackRight = 'backRight',
  Front = 'front',
  Back = 'back'
}

/**
 * Corner position identifiers
 */
export enum CornerPosition {
  FrontLeft = 'frontLeft',
  FrontRight = 'frontRight',
  BackLeft = 'backLeft',
  BackRight = 'backRight'
}

/**
 * Represents a point in 2D space
 */
export interface Point {
  x: number;  // X-coordinate (longitudinal position in the aircraft)
  y: number;  // Y-coordinate (lateral position in the aircraft)
}

/**
 * Represents an aircraft compartment
 */
export interface Compartment {
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
export interface WheelSpan {
  yStart: number;  // Starting Y-coordinate of the wheel's contact
  yEnd: number;    // Ending Y-coordinate of the wheel's contact
}

/**
 * Wheel configuration types for cargo items
 */
export type WheelType = '4_wheeled' | '2_wheeled' | 'bulk';

/**
 * Represents the corners of a cargo item
 */
export interface CargoCorners {
  [CornerPosition.FrontLeft]: Point;
  [CornerPosition.FrontRight]: Point;
  [CornerPosition.BackLeft]: Point;
  [CornerPosition.BackRight]: Point;
}

/**
 * Represents the wheel touchpoints for different cargo types
 */
export interface WheelTouchpoints {
  [position: string]: Point;
}

/**
 * The result of touchpoint compartment mapping
 */
export interface TouchpointCompartmentResult {
  /**
   * Map from touchpoint position (like frontLeft) to compartment ID
   */
  touchpointToCompartment: Record<TouchpointPosition, number>;
  
  /**
   * List of all compartment IDs that the cargo overlaps with
   */
  overlappingCompartments: number[];
}
```

## API

```typescript
/**
 * Calculates the four corner coordinates of a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns A map of corner positions to points
 */
export function getCargoCorners(cargoItemId: number): Promise<CargoCorners>

/**
 * Calculates the wheel touchpoint coordinates for a specific cargo item
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel configuration type ('4_wheeled', '2_wheeled', or 'bulk')
 * @returns A map of touchpoint positions to points
 */
export function getWheelTouchpoints(cargoItemId: number, wheelType: '4_wheeled' | '2_wheeled' | 'bulk'): Promise<WheelTouchpoints>

/**
 * Calculates the span of a wheel's contact with the floor along the y-axis
 * @param x - The x-coordinate of the wheel's center
 * @param y - The y-coordinate of the wheel's center
 * @param wheelWidth - The width of the wheel in inches
 * @returns The start and end y-coordinates of the wheel's contact with the floor
 */
export function getWheelContactSpan(x: number, y: number, wheelWidth: number): Promise<WheelSpan>

/**
 * Determines if a wheel touchpoint is positioned on a treadway
 * @param ySpan - The y-axis span of the wheel's contact with the floor
 * @param aircraftId - The ID of the aircraft to check treadway positions
 * @returns True if at least 50% of the wheel width is on a treadway, false otherwise
 */
export function isTouchpointOnTreadway(ySpan: WheelSpan, aircraftId: number): Promise<boolean>

/**
 * Determines if a cargo item is positioned on left and/or right treadways
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel configuration type ('4_wheeled', '2_wheeled', or 'bulk')
 * @param aircraftId - The ID of the aircraft to check treadway positions
 * @returns Tuple of [isOnRightTreadway, isOnLeftTreadway]
 */
export function isCargoOnTreadway(cargoItemId: number, wheelType: '4_wheeled' | '2_wheeled' | 'bulk', aircraftId: number): Promise<[boolean, boolean]>

/**
 * Identifies which compartments a cargo item's touchpoints are located in
 * @param cargoItemId - The ID of the cargo item
 * @param touchpointType - The type of touchpoints to check ('4_wheeled', '2_wheeled', or 'bulk')
 * @returns Mapping of touchpoints to compartments and list of all overlapping compartments
 */
export function getTouchpointCompartments(cargoItemId: number, touchpointType: '4_wheeled' | '2_wheeled' | 'bulk'): Promise<TouchpointCompartmentResult>
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
export async function getCargoCorners(cargoItemId: number): Promise<CargoCorners> {
  // 1. Validate and retrieve cargo item
  const cargoItemResponse = await getCargoItemById(cargoItemId);
  if (cargoItemResponse.count === 0 || !cargoItemResponse.results[0].data) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }

  const cargoItem = cargoItemResponse.results[0].data;

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
  
  // 4. Return the corners as a map with enum keys
  return {
    [CornerPosition.FrontLeft]: frontLeft,
    [CornerPosition.FrontRight]: frontRight,
    [CornerPosition.BackLeft]: backLeft,
    [CornerPosition.BackRight]: backRight
  };
}
```

#### getWheelTouchpoints

```typescript
export async function getWheelTouchpoints(
  cargoItemId: number, 
  wheelType: '4_wheeled' | '2_wheeled' | 'bulk'
): Promise<WheelTouchpoints> {
  // 1. Validate and retrieve cargo item
  const cargoItemResponse = await getCargoItemById(cargoItemId);
  if (cargoItemResponse.count === 0 || !cargoItemResponse.results[0].data) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  const cargoItem = cargoItemResponse.results[0].data;
  
  // Get cargo corners first
  const corners = await getCargoCorners(cargoItemId);
  
  // Extract corner points
  const frontLeft = corners[CornerPosition.FrontLeft];
  const frontRight = corners[CornerPosition.FrontRight];
  const backLeft = corners[CornerPosition.BackLeft];
  const backRight = corners[CornerPosition.BackRight];
  
  // Extract additional cargo properties
  const { forward_overhang, back_overhang } = cargoItem;
  
  // Calculate touchpoints based on wheel type
  switch (wheelType) {
    case '4_wheeled': {
      // Calculate wheel positions using corner coordinates and overhang values
      const frontWheelX = frontLeft.x + forward_overhang;
      const backWheelX = backLeft.x - back_overhang;
      
      return {
        [TouchpointPosition.FrontLeft]: { x: frontWheelX, y: frontLeft.y },
        [TouchpointPosition.FrontRight]: { x: frontWheelX, y: frontRight.y },
        [TouchpointPosition.BackLeft]: { x: backWheelX, y: backLeft.y },
        [TouchpointPosition.BackRight]: { x: backWheelX, y: backRight.y },
      };
    }
    
    case '2_wheeled': {
      // For two-wheeled items, wheels are centered along the y-axis
      const centerY = frontLeft.y + (frontRight.y - frontLeft.y) / 2;
      
      // Calculate wheel positions
      const frontWheelX = frontLeft.x + forward_overhang;
      const backWheelX = backLeft.x - back_overhang;
      
      return {
        [TouchpointPosition.Front]: { x: frontWheelX, y: centerY },
        [TouchpointPosition.Back]: { x: backWheelX, y: centerY },
      };
    }
    
    case 'bulk': {
      // For bulk items, use the corner coordinates directly
      return {
        [CornerPosition.FrontLeft]: frontLeft,
        [CornerPosition.FrontRight]: frontRight,
        [CornerPosition.BackLeft]: backLeft,
        [CornerPosition.BackRight]: backRight,
      };
    }
    
    default:
      throw new Error(`Invalid wheel type: ${wheelType}`);
  }
}
```

#### getWheelContactSpan

```typescript
export async function getWheelContactSpan(
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
export async function isTouchpointOnTreadway(
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

#### isCargoOnTreadway

```typescript
export async function isCargoOnTreadway(
  cargoItemId: number, 
  wheelType: '4_wheeled' | '2_wheeled' | 'bulk',
  aircraftId: number
): Promise<[boolean, boolean]> {
  // Get wheel touchpoints for the cargo
  const touchpoints = await getWheelTouchpoints(cargoItemId, wheelType);
  
  // Initialize result
  let rightTreadwayContact = false;
  let leftTreadwayContact = false;
  
  // Process based on wheel type
  if (wheelType === '2_wheeled') {
    // For 2-wheeled cargo, check front and back wheels
    const frontWheelSpan = await getWheelContactSpan(
      touchpoints.front.x,
      touchpoints.front.y,
      WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH
    );
    
    const backWheelSpan = await getWheelContactSpan(
      touchpoints.back.x,
      touchpoints.back.y,
      WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH
    );
    
    // Get aircraft data to determine left vs right treadway
    const aircraft = await getAircraftById(aircraftId);
    const centerY = 0; // Assuming the center is at y=0
    
    // Check which treadway the wheels are on
    if (touchpoints.front.y > centerY) {
      // Right side wheels
      rightTreadwayContact = 
        await isTouchpointOnTreadway(frontWheelSpan, aircraftId) && 
        await isTouchpointOnTreadway(backWheelSpan, aircraftId);
    } else {
      // Left side wheels
      leftTreadwayContact = 
        await isTouchpointOnTreadway(frontWheelSpan, aircraftId) && 
        await isTouchpointOnTreadway(backWheelSpan, aircraftId);
    }
    
  } else if (wheelType === '4_wheeled') {
    // For 4-wheeled cargo, check all four wheels
    const frontLeftWheelSpan = await getWheelContactSpan(
      touchpoints.frontLeft.x,
      touchpoints.frontLeft.y,
      WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH
    );
    
    const backLeftWheelSpan = await getWheelContactSpan(
      touchpoints.backLeft.x,
      touchpoints.backLeft.y,
      WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH
    );
    
    const frontRightWheelSpan = await getWheelContactSpan(
      touchpoints.frontRight.x,
      touchpoints.frontRight.y,
      WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH
    );
    
    const backRightWheelSpan = await getWheelContactSpan(
      touchpoints.backRight.x,
      touchpoints.backRight.y,
      WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH
    );
    
    // Check if all wheels on each side are on treadways
    leftTreadwayContact = 
      await isTouchpointOnTreadway(frontLeftWheelSpan, aircraftId) && 
      await isTouchpointOnTreadway(backLeftWheelSpan, aircraftId);
    
    rightTreadwayContact = 
      await isTouchpointOnTreadway(frontRightWheelSpan, aircraftId) && 
      await isTouchpointOnTreadway(backRightWheelSpan, aircraftId);
    
  } else if (wheelType === 'bulk') {
    // For bulk cargo, check each corner
    const cornerPositions = [
      CornerPosition.FrontLeft,
      CornerPosition.FrontRight,
      CornerPosition.BackLeft,
      CornerPosition.BackRight
    ];
    
    // Track which corners are on which treadways
    let leftCornerOnTreadway = false;
    let rightCornerOnTreadway = false;
    
    for (const position of cornerPositions) {
      const point = touchpoints[position];
      if (point) {
        // Create a small span around the corner point
        const cornerSpan = await getWheelContactSpan(
          point.x,
          point.y,
          5 // Use a small width to represent the corner contact
        );
        
        const isOnTreadway = await isTouchpointOnTreadway(cornerSpan, aircraftId);
        
        // Determine if this is a left or right corner based on position
        if (position === CornerPosition.FrontLeft || position === CornerPosition.BackLeft) {
          leftCornerOnTreadway = leftCornerOnTreadway || isOnTreadway;
        } else {
          rightCornerOnTreadway = rightCornerOnTreadway || isOnTreadway;
        }
      }
    }
    
    leftTreadwayContact = leftCornerOnTreadway;
    rightTreadwayContact = rightCornerOnTreadway;
  }
  
  return [rightTreadwayContact, leftTreadwayContact];
}
```

### getTouchpointCompartments

```typescript
export async function getTouchpointCompartments(
  cargoItemId: number, 
  touchpointType: '4_wheeled' | '2_wheeled' | 'bulk'
): Promise<TouchpointCompartmentResult> {
  // Get all necessary data
  const { cargoItem, compartments, touchpointsMap } = await getCargoAndCompartmentData(
    cargoItemId, 
    touchpointType
  );

  // Initialize result
  const result: TouchpointCompartmentResult = {
    touchpointToCompartment: {} as Record<TouchpointPosition, number>,
    overlappingCompartments: [],
  };

  // Calculate effective cargo footprint excluding overhangs
  const x_start_position = cargoItem.x_start_position || 0;
  const length = cargoItem.length || 0;
  const forward_overhang = cargoItem.forward_overhang || 0;
  const back_overhang = cargoItem.back_overhang || 0;
  
  // For wheeled cargo, exclude the overhang from the compartment overlap
  const effective_start = touchpointType !== 'bulk' ? x_start_position + forward_overhang : x_start_position;
  const effective_end = touchpointType !== 'bulk' ? x_start_position + length - back_overhang : x_start_position + length;

  // Get all compartments that overlap with the cargo's effective footprint
  for (const compartment of compartments) {
    if (!compartment) continue;
    
    if (effective_start < compartment.x_end && effective_end > compartment.x_start) {
      // Add to overlapping compartments list if not already there
      if (!result.overlappingCompartments.includes(compartment.id)) {
        result.overlappingCompartments.push(compartment.id);
      }
    }
  }

  // For bulk cargo, we only need the list of overlapping compartments
  if (touchpointType === 'bulk') {
    return result;
  }

  // For wheeled cargo, map each touchpoint to the compartment it's in using descriptive names
  if (touchpointType === '4_wheeled') {
    // Process touchpoints for four-wheeled cargo
    const positions = [
      TouchpointPosition.FrontLeft,
      TouchpointPosition.FrontRight,
      TouchpointPosition.BackLeft,
      TouchpointPosition.BackRight,
    ];
    
    positions.forEach(position => {
      const point = touchpointsMap[position];
      if (point) {
        for (const compartment of compartments) {
          if (!compartment) continue;
          
          // Check if the touchpoint is within the compartment
          if (point.x >= compartment.x_start && point.x <= compartment.x_end) {
            result.touchpointToCompartment[position] = compartment.id;
            break; // A touchpoint can only be in one compartment
          }
        }
      }
    });
    
  } else if (touchpointType === '2_wheeled') {
    // Process touchpoints for two-wheeled cargo
    const positions = [
      TouchpointPosition.Front,
      TouchpointPosition.Back,
    ];
    
    positions.forEach(position => {
      const point = touchpointsMap[position];
      if (point) {
        for (const compartment of compartments) {
          if (!compartment) continue;
          
          // Check if the touchpoint is within the compartment
          if (point.x >= compartment.x_start && point.x <= compartment.x_end) {
            result.touchpointToCompartment[position] = compartment.id;
            break; // A touchpoint can only be in one compartment
          }
        }
      }
    });
  }

  return result;
}
```

This function identifies which compartments a cargo item's touchpoints are located in, with the following key features:

1. For all cargo types, provides a list of all compartments that the cargo item's effective footprint overlaps with
   - For wheeled cargo, overhangs are excluded from the footprint calculation
   - For bulk cargo, the entire cargo length is considered

2. For wheeled cargo:
   - Uses descriptive names for touchpoints (frontLeft, frontRight, etc.) instead of coordinates
   - Maps each named position to the compartment it's in
   - Each touchpoint is assigned to exactly one compartment

3. For bulk cargo:
   - Only returns the list of overlapping compartments without touchpoint mapping

The result contains two parts:
- `overlappingCompartments`: List of IDs for all compartments that overlap with the cargo's effective footprint
- `touchpointToCompartment`: Map from named touchpoint positions to compartment IDs