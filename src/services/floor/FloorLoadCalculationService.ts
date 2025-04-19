import {
  getCargoItemById,
  getCargoTypeById,
  getCompartmentById,
  getCargoItemsByMissionId,
  CargoItem as DBCargoItem,
  Compartment as DBCompartment,
  CargoType as DBCargoType,
} from '@/services/db/operations';

import {
  getTouchpointCompartments,
} from './FloorLayoutService';

/**
 * Wheel type enumeration matching existing project convention
 */
export type WheelType = 'bulk' | '2_wheeled' | '4_wheeled';

/**
 * Constants for wheel dimensions
 */
export const WHEEL_DIMENSIONS = {
  '2_wheeled': {
    WHEEL_WIDTH: 10, // inches
    CONTACT_LENGTH: 3.0, // inches
    COUNT: 2,
  },
  '4_wheeled': {
    WHEEL_WIDTH: 10, // inches
    CONTACT_LENGTH: 2.5, // inches
    COUNT: 4,
  },
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
interface CargoItemWithType extends DBCargoItem {
  type: WheelType;
}

/**
 * Calculates the concentrated load for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns The concentrated load value and unit
 */
export async function calculateConcentratedLoad(cargoItemId: number): Promise<LoadResult> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemWithType(cargoItemId);
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
    unit: 'lbs/sq.in',
  };
}

/**
 * Calculates the load distribution across compartments for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns Array of compartment load results
 */
export async function calculateLoadPerCompartment(cargoItemId: number): Promise<CompartmentLoadResult[]> {
  // 1. Retrieve cargo item data
  const cargoItem = await getCargoItemWithType(cargoItemId);
  if (!cargoItem) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }

  // 2. Get cargo item's position and dimensions
  const cargoType = cargoItem.type;

  // 3. Initialize result array
  const result: CompartmentLoadResult[] = [];

  // Get touchpoint compartments information for all cargo types
  const touchpointResult = await getTouchpointCompartments(cargoItemId, cargoType);

  // 4. Calculate load per compartment based on cargo type
  switch (cargoType) {
    case 'bulk': {
      // For bulk cargo, use the overlapping compartments from touchpoint data
      const overlappingCompartmentIds = touchpointResult.overlappingCompartments;

      if (overlappingCompartmentIds.length === 0) {
        return result;
      }

      // Get all compartment details and calculate load distribution
      for (const compartmentId of overlappingCompartmentIds) {
        // Get compartment details
        const compartmentResponse = await getCompartmentById(compartmentId);
        if (compartmentResponse.count === 0 || !compartmentResponse.results[0].data) {
          continue;
        }
        const compartment = compartmentResponse.results[0].data as DBCompartment;

        // Calculate overlap percentage
        const overlapPercentage = calculateOverlapPercentage(cargoItem, compartment);

        if (overlapPercentage > 0) {
          const loadValue = cargoItem.weight! * overlapPercentage;
          result.push({
            compartmentId,
            load: {
              value: loadValue,
              unit: 'lbs',
            },
          });
        }
      }
      break;
    }

    case '2_wheeled':
    case '4_wheeled': {
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
            unit: 'lbs',
          },
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
  const cargoItem = await getCargoItemWithType(cargoItemId);
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
      const effectiveLength = cargoItem.length! - (cargoItem.forward_overhang! + cargoItem.back_overhang!);
      loadValue = cargoItem.weight! / effectiveLength;
      break;

    case '4_wheeled':
      const effectiveLength4Wheel = cargoItem.length! - (cargoItem.forward_overhang! + cargoItem.back_overhang!);
      // For 4-wheeled cargo, divide by 2 to get running load per side
      loadValue = (cargoItem.weight! / effectiveLength4Wheel) / 2;
      break;

    default:
      throw new Error(`Unsupported cargo type: ${cargoType}`);
  }

  return {
    value: loadValue,
    unit: 'lbs/in',
  };
}

/**
 * Retrieves cargo item data with type information by ID
 * @param cargoItemId - The ID of the cargo item
 * @returns CargoItem data with type or null if not found
 */
async function getCargoItemWithType(cargoItemId: number): Promise<CargoItemWithType | null> {
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
    type: cargoType.type,
  };
}

/**
 * Calculates the percentage of cargo item area that overlaps with a compartment
 * @param cargoItem - The cargo item
 * @param compartment - The compartment
 * @returns Overlap percentage (0 to 1)
 */
function calculateOverlapPercentage(cargoItem: CargoItemWithType, compartment: DBCompartment): number {
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

/**
 * Aggregates loads by compartment across all cargo items in a mission
 * @param missionId - The ID of the mission
 * @returns Map of compartment IDs to their total loads
 */
export async function aggregateCumulativeLoadByCompartment(missionId: number): Promise<Map<number, number>> {
  // 1. Get all cargo items for this mission
  const cargoItemsResponse = await getCargoItemsByMissionId(missionId);
  if (cargoItemsResponse.count === 0) {
    return new Map<number, number>();
  }

  const cargoItems = cargoItemsResponse.results.map(result => result.data as DBCargoItem);

  // 2. Calculate load per compartment for each cargo item using the existing service
  const loadPromises = cargoItems.map(cargoItem =>
    calculateLoadPerCompartment(cargoItem.id!)
  );
  const allCompartmentLoads = await Promise.all(loadPromises);

  // 3. Aggregate loads by compartment
  const totalLoadByCompartment = new Map<number, number>();

  allCompartmentLoads.forEach(compartmentLoads => {
    compartmentLoads.forEach(({ compartmentId, load }) => {
      const currentLoad = totalLoadByCompartment.get(compartmentId) || 0;
      totalLoadByCompartment.set(compartmentId, currentLoad + load.value);
    });
  });

  return totalLoadByCompartment;
}
