# Floor Load Calculation Service Technical Specification

## Overview
The Floor Load Calculation Service provides functionality to determine various load metrics for cargo items during aircraft loading operations. This is essential for ensuring proper weight distribution, preventing floor overload, and maintaining aircraft structural integrity during flight operations.

## Requirements

### Concentrated Load Calculation
- Calculate the concentrated load for any cargo item
- Support different cargo types (bulk, 2_wheeled, and 4_wheeled) with type-specific calculation methods
- Return appropriate load values based on cargo characteristics
- Use standard wheel dimensions and touchpoint positions

### Compartment Load Calculation
- Calculate the load distribution across compartments for any cargo item
- Support load distribution calculations for different cargo types
- Account for compartment-specific load limits
- Utilize wheel touchpoint positions to determine load distribution

### Running Load Calculation
- Calculate the running load (linear load) induced by any cargo item
- Support different cargo types with appropriate calculation methods
- Account for cargo positioning and dimensions

## API

```typescript
/**
 * Wheel type enumeration matching existing project convention
 */
type WheelType = 'bulk' | '2_wheeled' | '4_wheeled';

/**
 * Constants for wheel dimensions
 */
const WHEEL_DIMENSIONS = {
  '2_wheeled': {
    WHEEL_WIDTH: 2.5, // inches
    CONTACT_LENGTH: 3.0, // inches
    COUNT: 2
  },
  '4_wheeled': {
    WHEEL_WIDTH: 2.0, // inches
    CONTACT_LENGTH: 2.5, // inches
    COUNT: 4
  }
};

/**
 * Interface representing load calculation results
 */
interface LoadResult {
  value: number;
  unit: string;
}

/**
 * Interface representing compartment load results
 */
interface CompartmentLoadResult {
  compartmentId: number;
  load: LoadResult;
}

/**
 * Calculates the concentrated load for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The concentrated load value and unit
 */
calculateConcentratedLoad(cargoItemId: number): Promise<LoadResult>

/**
 * Calculates the load distribution across compartments for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns Array of compartment load results
 */
calculateLoadPerCompartment(cargoItemId: number): Promise<CompartmentLoadResult[]>

/**
 * Calculates the running load induced by a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The running load value and unit (for 4 wheeled item it returns the load per side)
 */
calculateRunningLoad(cargoItemId: number): Promise<LoadResult>
```

## Database Dependencies

The service relies on the following database tables:
- `cargo_item`: Contains cargo item details including weight, dimensions, and type
- `cargo_type`: Defines cargo specifications including weight distribution characteristics
- `compartment`: Stores compartment configurations including load limits
- `wheeled_cargo`: Additional details for wheeled cargo items including number of wheels and wheel dimensions

## Implementation Details

### Main Functions

#### calculateConcentratedLoad

```typescript
async function calculateConcentratedLoad(cargoItemId: number): Promise<LoadResult> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Calculate concentrated load based on cargo type
  let loadValue: number;
  const cargoType = cargoItem.type as WheelType;
  
  switch (cargoType) {
    case 'bulk':
      // For bulk cargo, divide weight by area
      const area = cargoItem.length * cargoItem.width;
      loadValue = cargoItem.weight / area;
      break;
      
    case '2_wheeled': {
      // Get wheel touchpoints
      const touchpoints = await getWheelTouchpoints(cargoItemId, cargoType);
      
      // Use constants for wheel dimensions
      const wheelWidth = WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['2_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['2_wheeled'].COUNT;
      
      // Calculate wheel contact area
      const wheelContactArea = wheelWidth * contactLength;
      
      // Calculate load per wheel contact area
      loadValue = cargoItem.weight / (wheelCount * wheelContactArea);
      break;
    }
    
    case '4_wheeled': {
      // Get wheel touchpoints
      const touchpoints = await getWheelTouchpoints(cargoItemId, cargoType);
      
      // Use constants for wheel dimensions
      const wheelWidth = WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['4_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['4_wheeled'].COUNT;
      
      // Calculate wheel contact area
      const wheelContactArea = wheelWidth * contactLength;
      
      // Calculate load per wheel contact area
      loadValue = cargoItem.weight / (wheelCount * wheelContactArea);
      break;
    }
      
    default:
      throw new Error(`Unsupported cargo type: ${cargoType}`);
  }
  
  return {
    value: loadValue,
    unit: 'lbs/sq.in'
  };
}
```

#### calculateLoadPerCompartment

```typescript
async function calculateLoadPerCompartment(cargoItemId: number): Promise<CompartmentLoadResult[]> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Get wheel touchpoints and touchpoint-to-compartment mapping
  const cargoType = cargoItem.type as WheelType;
  const touchpoints = await getWheelTouchpoints(cargoItemId, cargoType);
  const touchpointCompartments = await getTouchpointCompartments(cargoItemId, cargoType);
  
  // 3. Initialize result array
  const result: CompartmentLoadResult[] = [];
  
  // 4. Calculate load per compartment based on cargo type
  switch (cargoType) {
    case '2_wheeled': {
      // Use constants for wheel count
      const wheelCount = WHEEL_DIMENSIONS['2_wheeled'].COUNT;
      
      // Calculate load per wheel
      const loadPerWheel = cargoItem.weight / wheelCount;
      
      // Map touchpoints to compartments
      const { touchpointToCompartment } = touchpointCompartments;
      
      // Create map to accumulate load per compartment
      const compartmentLoads = new Map<number, number>();
      
      // Add load from front wheel
      if (touchpointToCompartment[TouchpointPosition.Front]) {
        const compartmentId = touchpointToCompartment[TouchpointPosition.Front];
        compartmentLoads.set(compartmentId, (compartmentLoads.get(compartmentId) || 0) + loadPerWheel);
      }
      
      // Add load from back wheel
      if (touchpointToCompartment[TouchpointPosition.Back]) {
        const compartmentId = touchpointToCompartment[TouchpointPosition.Back];
        compartmentLoads.set(compartmentId, (compartmentLoads.get(compartmentId) || 0) + loadPerWheel);
      }
      
      break;
    }
    
    case '4_wheeled': {
      // Use constants for wheel count
      const wheelCount = WHEEL_DIMENSIONS['4_wheeled'].COUNT;
      
      // Calculate load per wheel
      const loadPerWheel = cargoItem.weight / wheelCount;
      
      // Map touchpoints to compartments
      const { touchpointToCompartment } = touchpointCompartments;
      
      // Create map to accumulate load per compartment
      const compartmentLoads = new Map<number, number>();
      
      // Add load from each wheel touchpoint
      const wheelPositions = [
        TouchpointPosition.FrontLeft,
        TouchpointPosition.FrontRight,
        TouchpointPosition.BackLeft,
        TouchpointPosition.BackRight
      ];
      
      for (const position of wheelPositions) {
        if (touchpointToCompartment[position]) {
          const compartmentId = touchpointToCompartment[position];
          compartmentLoads.set(compartmentId, (compartmentLoads.get(compartmentId) || 0) + loadPerWheel);
        }
      }
      
      break;
    }
    
    case 'bulk': {
      // To be implemented.      
      break;
    }
    
    default:
      throw new Error(`Unsupported cargo type: ${cargoType}`);
  }
  
  return result;
}
```

#### calculateRunningLoad

```typescript
async function calculateRunningLoad(cargoItemId: number): Promise<LoadResult> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemById(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  
  // 2. Calculate running load based on cargo type
  let loadValue: number;
  const cargoType = cargoItem.type as WheelType;
  
  switch (cargoType) {
    case 'bulk':
      // For bulk cargo, divide weight by length
      loadValue = cargoItem.weight / cargoItem.length;
      break;
      
    case '2_wheeled':
      // For 2-wheeled cargo, consider effective length (excluding overhangs)
      const effectiveLength = cargoItem.length - (cargoItem.forward_overhang + cargoItem.back_overhang);
      loadValue = cargoItem.weight / effectiveLength;
      break;
      
    case '4_wheeled':
      // For 4-wheeled cargo, consider effective length (excluding overhangs)
      const effectiveLength4Wheel = cargoItem.length - (cargoItem.forward_overhang + cargoItem.back_overhang);
      loadValue = cargoItem.weight / effectiveLength4Wheel;
      break;
      
    default:
      throw new Error(`Unsupported cargo type: ${cargoType}`);
  }
  
  return {
    value: loadValue,
    unit: 'lbs/in'
  };
}
```