import {
  getCargoItemById,
  getAircraftById,
  getCompartmentsByAircraftId,
  getMissionById,
} from '@/services/db/operations';

import {
  WHEEL_DIMENSIONS,
} from './FloorLoadCalculationService';

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
 * Represents the overlap of an item with a compartment
 */
export interface CompartmentOverlap {
  start_x: number;  // Starting X-coordinate of the overlap
  end_x: number;    // Ending X-coordinate of the overlap
}

/**
 * Maps compartment IDs to their overlap information
 */
export interface CompartmentOverlapMap {
  [compartmentId: number]: CompartmentOverlap;
}

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
 * Calculates the four corner coordinates of a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @returns A map of corner positions to points
 */
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
    y: y_start_position,
  };

  const frontRight: Point = {
    x: x_start_position,
    y: y_start_position + width,
  };

  const backLeft: Point = {
    x: x_start_position + length,
    y: y_start_position,
  };

  const backRight: Point = {
    x: x_start_position + length,
    y: y_start_position + width,
  };

  // 4. Return the corners as a map with enum keys
  return {
    [CornerPosition.FrontLeft]: frontLeft,
    [CornerPosition.FrontRight]: frontRight,
    [CornerPosition.BackLeft]: backLeft,
    [CornerPosition.BackRight]: backRight,
  };
}

/**
 * Calculates the wheel touchpoint coordinates for a specific cargo item
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel configuration type ('4_wheeled', '2_wheeled', or 'bulk')
 * @returns A map of touchpoint positions to points
 */
export async function getWheelTouchpoints(
  cargoItemId: number,
  wheelType: WheelType
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

  // 3. Calculate touchpoints based on wheel type
  switch (wheelType) {
    case '4_wheeled': {
      // Calculate wheel positions using corner coordinates and overhang values
      // Use x-axis values from corners plus overhang adjustment
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
      // For two-wheeled items, there are both front and back wheels
      // positioned at forward_overhang and back_overhang from their respective edges
      // Both wheel pairs are centered along the y-axis

      // Calculate center point along the y-axis
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

/**
 * Calculates the span of a wheel's contact with the floor along the y-axis
 * @param x - The x-coordinate of the wheel's center
 * @param y - The y-coordinate of the wheel's center
 * @param wheelWidth - The width of the wheel in inches
 * @returns The start and end y-coordinates of the wheel's contact with the floor
 */
export async function getWheelContactSpan(
  x: number,
  y: number,
  wheelWidth: number
): Promise<WheelSpan> {
  // Validate input parameters
  if (wheelWidth <= 0) {
    throw new Error('Wheel width must be a positive number');
  }

  // Calculate the span of the wheel's contact with the floor
  const halfWidth = wheelWidth / 2;

  // Return the start and end y-coordinates
  return {
    yStart: y - halfWidth,
    yEnd: y + halfWidth,
  };
}

/**
 * Determines if a wheel touchpoint is positioned on a treadway
 * @param ySpan - The y-axis span of the wheel's contact with the floor
 * @param aircraftId - The ID of the aircraft to check treadway positions
 * @returns True if at least 50% of the wheel width is on a treadway, false otherwise
 */
export async function isTouchpointOnTreadway(
  ySpan: WheelSpan,
  aircraftId: number
): Promise<boolean> {
  // 1. Retrieve aircraft data
  const aircraftResponse = await getAircraftById(aircraftId);
  if (aircraftResponse.count === 0 || !aircraftResponse.results[0].data) {
    throw new Error(`Aircraft with ID ${aircraftId} not found`);
  }

  const aircraft = aircraftResponse.results[0].data;

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

/**
 * Retrieves cargo, mission, and compartment data needed for touchpoint analysis
 * @param cargoItemId - The ID of the cargo item
 * @returns The cargo item, compartments, and touchpoint data
 */
async function getCargoAndCompartmentData(cargoItemId: number, touchpointType: WheelType): Promise<{
  cargoItem: any;
  compartments: any[];
  touchpointsMap: WheelTouchpoints;
}> {
  // 1. Get cargo item data
  const cargoItemResponse = await getCargoItemById(cargoItemId);
  if (cargoItemResponse.count === 0 || !cargoItemResponse.results[0].data) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  const cargoItem = cargoItemResponse.results[0].data;

  // 2. Get aircraft ID from the mission
  const missionResponse = await getMissionById(cargoItem.mission_id);
  if (missionResponse.count === 0 || !missionResponse.results[0].data) {
    throw new Error(`Mission with ID ${cargoItem.mission_id} not found`);
  }
  const mission = missionResponse.results[0].data;

  // 3. Get all compartments for the aircraft
  const compartmentsResponse = await getCompartmentsByAircraftId(mission.aircraft_id);
  const compartments = compartmentsResponse.results
    .map(result => result.data)
    .filter(compartment => compartment !== undefined);

  // 4. Get touchpoints based on the type
  const touchpointsMap = await getWheelTouchpoints(cargoItemId, touchpointType);

  return { cargoItem, compartments, touchpointsMap };
}

/**
 * Identifies which compartments a cargo item's touchpoints are located in
 * @param cargoItemId - The ID of the cargo item
 * @param touchpointType - The type of touchpoints to check ('4_wheeled', '2_wheeled', or 'bulk')
 * @returns Touchpoint to compartment mapping and list of all overlapping compartments
 */
export async function getTouchpointCompartments(
  cargoItemId: number,
  touchpointType: WheelType
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
    if (!compartment) { continue; }

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
          if (!compartment) { continue; }

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
          if (!compartment) { continue; }

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

/**
 * Check if a span overlaps with specified boundaries
 * @param start Start of the span
 * @param end End of the span
 * @param boundaryStart Start of the boundary
 * @param boundaryEnd End of the boundary
 * @returns True if there is any overlap
 */
function hasOverlap(start: number, end: number, boundaryStart: number, boundaryEnd: number): boolean {
  return (
    (start >= boundaryStart && start <= boundaryEnd) || // Start point is within boundaries
    (end >= boundaryStart && end <= boundaryEnd) ||     // End point is within boundaries
    (start <= boundaryStart && end >= boundaryEnd)      // Span completely contains the boundary
  );
}

/**
 * Get the treadway boundaries for an aircraft
 * @param aircraftId The ID of the aircraft
 * @returns Object containing left and right treadway boundaries
 */
async function getTreadwayBoundaries(aircraftId: number): Promise<{
  leftTreadwayStart: number;
  leftTreadwayEnd: number;
  rightTreadwayStart: number;
  rightTreadwayEnd: number;
}> {
  const aircraftResponse = await getAircraftById(aircraftId);
  if (aircraftResponse.count === 0 || !aircraftResponse.results[0].data) {
    throw new Error(`Aircraft with ID ${aircraftId} not found`);
  }
  const aircraft = aircraftResponse.results[0].data;

  // Calculate treadway boundaries
  const { treadways_width, treadways_dist_from_center } = aircraft;
  const leftTreadwayStart = -treadways_dist_from_center - treadways_width / 2;
  const leftTreadwayEnd = -treadways_dist_from_center + treadways_width / 2;
  const rightTreadwayStart = treadways_dist_from_center - treadways_width / 2;
  const rightTreadwayEnd = treadways_dist_from_center + treadways_width / 2;

  return {
    leftTreadwayStart,
    leftTreadwayEnd,
    rightTreadwayStart,
    rightTreadwayEnd,
  };
}

/**
 * Check if 2-wheeled cargo wheels overlap with treadways
 * @param touchpoints The wheel touchpoints
 * @param treadwayBoundaries The treadway boundaries
 * @param aircraftId The ID of the aircraft
 * @returns Tuple of [isOnRightTreadway, isOnLeftTreadway, isInBetweenTreadways]
 */
async function check2WheeledTreadwayContact(
  touchpoints: WheelTouchpoints,
  treadwayBoundaries: ReturnType<typeof getTreadwayBoundaries> extends Promise<infer T> ? T : never,
  aircraftId: number
): Promise<[boolean, boolean, boolean]> {
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

  const frontWheelOnTreadway = await isTouchpointOnTreadway(frontWheelSpan, aircraftId);
  const backWheelOnTreadway = await isTouchpointOnTreadway(backWheelSpan, aircraftId);

  const wheelsOnTreadway = frontWheelOnTreadway && backWheelOnTreadway;

  const { leftTreadwayStart, leftTreadwayEnd, rightTreadwayStart, rightTreadwayEnd } = treadwayBoundaries;

  const onLeftTreadway =
    hasOverlap(frontWheelSpan.yStart, frontWheelSpan.yEnd, leftTreadwayStart, leftTreadwayEnd) &&
    hasOverlap(backWheelSpan.yStart, backWheelSpan.yEnd, leftTreadwayStart, leftTreadwayEnd);

  const onRightTreadway =
    hasOverlap(frontWheelSpan.yStart, frontWheelSpan.yEnd, rightTreadwayStart, rightTreadwayEnd) &&
    hasOverlap(backWheelSpan.yStart, backWheelSpan.yEnd, rightTreadwayStart, rightTreadwayEnd);

  // Cargo is "between treadways" if it's in the middle, before, or after them
  const isNotOnTreadway = !onLeftTreadway && !onRightTreadway;

  return [onRightTreadway && wheelsOnTreadway, onLeftTreadway && wheelsOnTreadway, isNotOnTreadway];
}

/**
 * Check if 4-wheeled cargo wheels overlap with treadways
 * @param touchpoints The wheel touchpoints
 * @param treadwayBoundaries The treadway boundaries
 * @param aircraftId The ID of the aircraft
 * @returns Tuple of [isOnRightTreadway, isOnLeftTreadway, isInBetweenTreadways]
 */
async function check4WheeledTreadwayContact(
  touchpoints: WheelTouchpoints,
  treadwayBoundaries: ReturnType<typeof getTreadwayBoundaries> extends Promise<infer T> ? T : never,
  aircraftId: number
): Promise<[boolean, boolean, boolean]> {
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

  // Check if left wheels are on left treadway
  const frontLeftOnTreadway = await isTouchpointOnTreadway(frontLeftWheelSpan, aircraftId);
  const backLeftOnTreadway = await isTouchpointOnTreadway(backLeftWheelSpan, aircraftId);
  const leftWheelsOnTreadway = frontLeftOnTreadway && backLeftOnTreadway;

  // Check if right wheels are on right treadway
  const frontRightOnTreadway = await isTouchpointOnTreadway(frontRightWheelSpan, aircraftId);
  const backRightOnTreadway = await isTouchpointOnTreadway(backRightWheelSpan, aircraftId);
  const rightWheelsOnTreadway = frontRightOnTreadway && backRightOnTreadway;


  // For 4-wheeled cargo, if any wheels are between, before, or after treadways
  const isBetweenTreadways = rightWheelsOnTreadway && !leftWheelsOnTreadway ||
    leftWheelsOnTreadway && !rightWheelsOnTreadway;
  return [rightWheelsOnTreadway, leftWheelsOnTreadway, isBetweenTreadways];
}

/**
 * Check if bulk cargo overlaps with treadways
 * @param cargoItemId The ID of the cargo item
 * @param treadwayBoundaries The treadway boundaries
 * @returns Tuple of [isOnRightTreadway, isOnLeftTreadway, isInBetweenTreadways]
 */
async function checkBulkTreadwayContact(
  cargoItemId: number,
  treadwayBoundaries: ReturnType<typeof getTreadwayBoundaries> extends Promise<infer T> ? T : never
): Promise<[boolean, boolean, boolean]> {
  // Get cargo dimensions
  const cargoItemResponse = await getCargoItemById(cargoItemId);
  if (cargoItemResponse.count === 0 || !cargoItemResponse.results[0].data) {
    throw new Error(`Cargo item with ID ${cargoItemId} not found`);
  }
  const cargoItem = cargoItemResponse.results[0].data;

  const cargoYStart = cargoItem.y_start_position;
  const cargoYEnd = cargoItem.y_start_position + cargoItem.width;

  const { leftTreadwayStart, leftTreadwayEnd, rightTreadwayStart, rightTreadwayEnd } = treadwayBoundaries;

  const leftTreadwayOverlap = hasOverlap(cargoYStart, cargoYEnd, leftTreadwayStart, leftTreadwayEnd);

  const rightTreadwayOverlap = hasOverlap(cargoYStart, cargoYEnd, rightTreadwayStart, rightTreadwayEnd);

  // Check if the cargo is completely between treadways (in the middle)
  const isBetweenTreadways =
    !leftTreadwayOverlap &&
    !rightTreadwayOverlap &&
    cargoYStart > leftTreadwayEnd &&
    cargoYEnd < rightTreadwayStart;

  // Check if the cargo is before left treadway
  const isBeforeTreadways = cargoYEnd < leftTreadwayStart;

  // Check if the cargo is after right treadway
  const isAfterTreadways = cargoYStart > rightTreadwayEnd;

  // Cargo is "between treadways" if it's in the middle, before, or after them
  const isNotOnTreadway = isBetweenTreadways || isBeforeTreadways || isAfterTreadways;

  return [rightTreadwayOverlap, leftTreadwayOverlap, isNotOnTreadway];
}

/**
 * Determines if a cargo item is positioned on left and/or right treadways or between them
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel configuration type ('4_wheeled', '2_wheeled', or 'bulk')
 * @param aircraftId - The ID of the aircraft to check treadway positions
 * @returns Tuple of [isOnRightTreadway, isOnLeftTreadway, isInBetweenTreadways]
 */
export async function isCargoOnTreadway(
  cargoItemId: number,
  wheelType: WheelType,
  aircraftId: number
): Promise<[boolean, boolean, boolean]> {
  // Get treadway boundaries from aircraft
  const treadwayBoundaries = await getTreadwayBoundaries(aircraftId);

  if (wheelType === '2_wheeled') {
    const touchpoints = await getWheelTouchpoints(cargoItemId, wheelType);
    return check2WheeledTreadwayContact(touchpoints, treadwayBoundaries, aircraftId);

  } else if (wheelType === '4_wheeled') {
    const touchpoints = await getWheelTouchpoints(cargoItemId, wheelType);
    return check4WheeledTreadwayContact(touchpoints, treadwayBoundaries, aircraftId);

  } else if (wheelType === 'bulk') {
    return checkBulkTreadwayContact(cargoItemId, treadwayBoundaries);
  }

  // Default case: no treadway contact
  return [false, false, false];
}
