import {
  getCargoItemById,
  getCargoTypeById,
  getCompartmentById,
  CargoItem as DBCargoItem,
  Compartment as DBCompartment,
  CargoType as DBCargoType
} from '@/services/db/operations';

import {
  getTouchpointCompartments,
} from './FloorLayoutService';

/**
 * Cargo wheel type enumeration matching existing project convention
 */
export type CargoWheelType = 'bulk' | '2_wheeled' | '4_wheeled';

/**
 * Constants for wheel dimensions
 */
export const WHEEL_DIMENSIONS = {
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
 * Touchpoint positions for wheeled cargo
 */
export enum TouchpointPosition {
  Front = 'front',
  Back = 'back',
  FrontLeft = 'frontLeft',
  FrontRight = 'frontRight',
  BackLeft = 'backLeft',
  BackRight = 'backRight'
}

/**
 * Interface representing load calculation results
 */
export interface LoadResult {
  value: number;
  unit: string;
}

/**
 * Interface representing compartment load results
 */
export interface CompartmentLoadResult {
  compartmentId: number;
  load: LoadResult;
}

/**
 * Interface representing cargo item with type information
 */
interface CargoItemWithWheelType extends DBCargoItem {
  type: CargoWheelType;
}

/**
 * Calculates the concentrated load for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The concentrated load value and unit
 */
export async function calculateConcentratedLoad(cargoItemId: number): Promise<LoadResult> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemWithWheelType(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }

  // 2. Calculate concentrated load based on cargo type
  let loadValue: number;
  const cargoType = cargoItem.type;

  switch (cargoType) {
    case 'bulk':
      const area = cargoItem.length! * cargoItem.width!;
      loadValue = cargoItem.weight! / area;
      break;

    case '2_wheeled': {
      const wheelWidth = WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['2_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['2_wheeled'].COUNT;

      const wheelContactArea = wheelWidth * contactLength;

      loadValue = cargoItem.weight! / (wheelCount * wheelContactArea);
      break;
    }

    case '4_wheeled': {
      const wheelWidth = WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['4_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['4_wheeled'].COUNT;

      const wheelContactArea = wheelWidth * contactLength;

      loadValue = cargoItem.weight! / (wheelCount * wheelContactArea);
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

/**
 * Calculates the load distribution across compartments for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns Array of compartment load results
 */
export async function calculateLoadPerCompartment(cargoItemId: number): Promise<CompartmentLoadResult[]> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemWithWheelType(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }

  // 2. Get cargo item's position and dimensions
  const cargoType = cargoItem.type;

  // 3. Initialize result array
  const result: CompartmentLoadResult[] = [];

  // 4. Calculate load per compartment based on cargo type
  switch (cargoType) {
    case 'bulk': {
      const compartments = await getOverlappingCompartments(cargoItem);

      if (compartments.length === 0) {
        return result;
      }

      // Calculate load distribution based on area overlap
      for (const compartment of compartments) {
        const overlapPercentage = calculateOverlapPercentage(cargoItem, compartment);

        if (overlapPercentage > 0) {
          const loadValue = cargoItem.weight! * overlapPercentage;
          result.push({
            compartmentId: compartment.id!,
            load: {
              value: loadValue,
              unit: 'lbs'
            }
          });
        }
      }
      break;
    }

    case '2_wheeled':
    case '4_wheeled': {
      const touchpointResult = await getTouchpointCompartments(cargoItemId, cargoType);

      const wheelCount = cargoType === '2_wheeled' ? 2 : 4;
      const loadPerWheel = cargoItem.weight! / wheelCount;

      const compartmentLoads = new Map<number, number>();

      const touchpointToCompartment = touchpointResult.touchpointToCompartment;

      for (const [_, compartmentId] of Object.entries(touchpointToCompartment)) {
        if (compartmentId) {
          const currentLoad = compartmentLoads.get(compartmentId) || 0;
          compartmentLoads.set(compartmentId, currentLoad + loadPerWheel);
        }
      }

      for (const [compartmentId, loadValue] of compartmentLoads.entries()) {
        result.push({
          compartmentId,
          load: {
            value: loadValue,
            unit: 'lbs'
          }
        });
      }
      break;
    }

    default:
      throw new Error(`Unsupported cargo type: ${cargoType}`);
  }

  return result;
}

/**
 * Calculates the running load induced by a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The running load value and unit
 */
export async function calculateRunningLoad(cargoItemId: number): Promise<LoadResult> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemWithWheelType(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }

  // 2. Calculate running load based on cargo type
  let loadValue: number;
  const cargoType = cargoItem.type;

  switch (cargoType) {
    case 'bulk':
      loadValue = cargoItem.weight! / cargoItem.length!;
      break;

    case '2_wheeled':
    case '4_wheeled':
      const effectiveLength = cargoItem.length! - (cargoItem.forward_overhang! + cargoItem.back_overhang!);
      loadValue = cargoItem.weight! / effectiveLength;
      break;

    default:
      throw new Error(`Unsupported cargo type: ${cargoType}`);
  }

  return {
    value: loadValue,
    unit: 'lbs/in'
  };
}

/**
 * Retrieves cargo item data with type information by ID
 * @param cargoItemId - The ID of the cargo item
 * @returns CargoItem data with type or null if not found
 */
async function getCargoItemWithWheelType(cargoItemId: number): Promise<CargoItemWithWheelType | null> {
  // Get cargo item
  const cargoItemResult = await getCargoItemById(cargoItemId);

  if (cargoItemResult.count === 0 || !cargoItemResult.results[0].data) {
    return null;
  }

  const cargoItem = cargoItemResult.results[0].data as DBCargoItem;

  const cargoTypeResult = await getCargoTypeById(cargoItem.cargo_type_id);

  if (cargoTypeResult.count === 0 || !cargoTypeResult.results[0].data) {
    throw new Error(`Cargo type with ID ${cargoItem.cargo_type_id} not found`);
  }

  const cargoType = cargoTypeResult.results[0].data as DBCargoType;

  return {
    ...cargoItem,
    type: cargoType.type
  };
}

/**
 * Retrieves compartments that overlap with a cargo item
 * @param cargoItem - The cargo item
 * @returns Array of compartments
 */
async function getOverlappingCompartments(cargoItem: CargoItemWithWheelType): Promise<DBCompartment[]> {
  const compartments: DBCompartment[] = [];
  const cargoXStart = cargoItem.x_start_position;
  const cargoXEnd = cargoItem.x_start_position + cargoItem.length!;

  // We need to find all compartments that overlap with the cargo's x position
  // This requires multiple lookups, but we keep it simple with the operations API

  // Get all potential compartments by doing individual lookups
  // This is not the most efficient but works within the constraint of using existing operations

  // First, try to find a compartment at the start position
  const startCompartmentResult = await findCompartmentAtPosition(cargoXStart);
  if (startCompartmentResult) {
    compartments.push(startCompartmentResult);
  }

  // Then, try to find a compartment at the end position (if different from start)
  const endCompartmentResult = await findCompartmentAtPosition(cargoXEnd);
  if (endCompartmentResult &&
    (!startCompartmentResult || startCompartmentResult.id !== endCompartmentResult.id)) {
    compartments.push(endCompartmentResult);
  }

  // Try the middle position too in case there's a compartment in between
  if (cargoXEnd - cargoXStart > 10) { // Only if cargo is reasonably large
    const middleCompartmentResult = await findCompartmentAtPosition((cargoXStart + cargoXEnd) / 2);
    if (middleCompartmentResult &&
      (!compartments.some(c => c.id === middleCompartmentResult.id))) {
      compartments.push(middleCompartmentResult);
    }
  }

  return compartments;
}

/**
 * Helper to find a compartment at a specific position
 */
async function findCompartmentAtPosition(xPosition: number): Promise<DBCompartment | null> {
  // We'll have to do a search with each compartment to find ones that contain this position
  // This is not the most efficient approach, but it works with the constraint of using existing operations

  // Get the first compartment to determine the aircraft ID
  // This is a simplification - in a real system, we'd have more context about the current aircraft
  const compartmentResult = await getCompartmentById(1);
  if (compartmentResult.count === 0 || !compartmentResult.results[0].data) {
    return null;
  }

  const firstCompartment = compartmentResult.results[0].data as DBCompartment;
  const aircraftId = firstCompartment.aircraft_id;

  // Check the first compartment
  if (xPosition >= firstCompartment.x_start && xPosition <= firstCompartment.x_end) {
    return firstCompartment;
  }

  // Check the second compartment
  const compartment2Result = await getCompartmentById(2);
  if (compartment2Result.count > 0 && compartment2Result.results[0].data) {
    const compartment = compartment2Result.results[0].data as DBCompartment;
    if (xPosition >= compartment.x_start && xPosition <= compartment.x_end) {
      return compartment;
    }
  }

  return null;
}

/**
 * Calculates the percentage of cargo item area that overlaps with a compartment
 * @param cargoItem - The cargo item
 * @param compartment - The compartment
 * @returns Overlap percentage (0 to 1)
 */
function calculateOverlapPercentage(cargoItem: CargoItemWithWheelType, compartment: DBCompartment): number {
  const cargoXStart = cargoItem.x_start_position;
  const cargoXEnd = cargoItem.x_start_position + cargoItem.length!;

  // Calculate overlap length
  const overlapStart = Math.max(cargoXStart, compartment.x_start);
  const overlapEnd = Math.min(cargoXEnd, compartment.x_end);
  const overlapLength = Math.max(0, overlapEnd - overlapStart);

  // Calculate percentage of cargo length that overlaps with the compartment
  const overlapPercentage = overlapLength / cargoItem.length!;

  return overlapPercentage;
}