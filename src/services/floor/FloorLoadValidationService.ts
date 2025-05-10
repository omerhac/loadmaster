import {
  getCompartmentById,
  getMissionById,
  getCargoTypeById,
  getCompartmentsByAircraftId,
  getCargoItemsByMissionId,
  getLoadConstraintsByCompartmentId,
  Compartment as DBCompartment,
  CargoItem as DBCargoItem,
  CargoType as DBCargoType,
  LoadConstraint as DBLoadConstraint,
} from '../db/operations';

import {
  getTouchpointCompartments,
} from './FloorLayoutService';

import {
  aggregateCumulativeLoadByCompartment,
  calculateConcentratedLoad,
  WheelType,
} from './FloorLoadCalculationService';

/**
 * Validation result status
 */
export enum ValidationStatus {
  Pass = 'PASS',
  Fail = 'FAIL'
}

/**
 * Types of load constraints that can be validated
 */
export enum LoadConstraintType {
  Cumulative = 'cumulative',
  Concentrated = 'concentrated',
  Running = 'running'
}

/**
 * Base interface for validation results
 */
export interface ValidationResult {
  status: ValidationStatus;
  constraintType: LoadConstraintType;
  compartmentId: number;
  compartmentName: string;
  message: string;
}

/**
 * Validation result for cumulative load constraints
 */
export interface CumulativeLoadValidationResult extends ValidationResult {
  constraintType: LoadConstraintType.Cumulative;
  currentLoad: number;
  maxAllowedLoad: number;
  overageAmount: number;
}

/**
 * Validation result for concentrated load constraints
 */
export interface ConcentratedLoadValidationResult extends ValidationResult {
  constraintType: LoadConstraintType.Concentrated;
  cargoItemId: number;
  currentLoad: number;
  maxAllowedLoad: number;
  overageAmount: number;
}

/**
 * Running load category
 */
export enum RunningLoadCategory {
  Treadway = 'treadway',
  BetweenTreadway = 'between_treadway'
}

/**
 * Validation result for running load constraints
 */
export interface RunningLoadValidationResult extends ValidationResult {
  constraintType: LoadConstraintType.Running;
  currentLoad: number;
  maxAllowedLoad: number;
  overageAmount: number;
  loadCategory: RunningLoadCategory;
}

/**
 * Union type for all validation result types
 */
export type LoadValidationResult =
  | CumulativeLoadValidationResult
  | ConcentratedLoadValidationResult
  | RunningLoadValidationResult;

/**
 * Comprehensive mission validation results
 */
export interface MissionValidationResults {
  missionId: number;
  status: ValidationStatus;
  results: LoadValidationResult[];
}

/**
 * Validates all load constraints for a mission
 * @param missionId - The ID of the mission to validate
 * @returns Comprehensive validation results with pass/fail status
 */
export async function validateMissionLoadConstraints(missionId: number): Promise<MissionValidationResults> {
  // 1. Run validation types (excluding running load for now)
  // TODO: Add running load validation
  const [cumulativeResults, concentratedResults] = await Promise.all([
    validateCumulativeLoad(missionId),
    validateConcentratedLoad(missionId),
  ]);

  // 2. Combine all results
  const allResults: LoadValidationResult[] = [
    ...cumulativeResults,
    ...concentratedResults,
  ];

  // 3. Determine overall status - fails if any constraint fails
  const overallStatus = allResults.some(result => result.status === ValidationStatus.Fail)
    ? ValidationStatus.Fail
    : ValidationStatus.Pass;

  return {
    missionId,
    status: overallStatus,
    results: allResults,
  };
}

/**
 * Validates cumulative load constraints for all compartments in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of cumulative load validation results
 */
export async function validateCumulativeLoad(missionId: number): Promise<CumulativeLoadValidationResult[]> {
  // 1. Get aggregated load by compartment
  const compartmentLoads = await aggregateCumulativeLoadByCompartment(missionId);

  // 2. Get all relevant compartments for the mission's aircraft
  const missionResult = await getMissionById(missionId);
  if (missionResult.count === 0 || !missionResult.results[0].data) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  const aircraftId = missionResult.results[0].data.aircraft_id;
  const compartmentsResult = await getCompartmentsByAircraftId(aircraftId);
  if (compartmentsResult.count === 0) {
    throw new Error(`No compartments found for aircraft with ID ${aircraftId}`);
  }

  const compartments = compartmentsResult.results.map(result => result.data as DBCompartment);

  // 3. Get load constraints for each compartment
  const loadConstraintsPromises = compartments.map(compartment =>
    getLoadConstraintsByCompartmentId(compartment.id!)
  );

  const loadConstraintsResults = await Promise.all(loadConstraintsPromises);

  // 4. Initialize results array
  const results: CumulativeLoadValidationResult[] = [];

  // 5. Validate each compartment against its constraints
  for (let i = 0; i < compartments.length; i++) {
    const compartment = compartments[i];
    const currentLoad = compartmentLoads.get(compartment.id!) || 0;

    const constraintsResult = loadConstraintsResults[i];
    if (constraintsResult.count === 0 || !constraintsResult.results[0].data?.max_cumulative_weight) {
      throw new Error(`No constraints found for compartment with ID ${compartment.id}`);
    }

    const maxAllowedLoad = constraintsResult.results[0].data.max_cumulative_weight;

    const overageAmount = Math.max(0, currentLoad - maxAllowedLoad);

    const status = currentLoad <= maxAllowedLoad
      ? ValidationStatus.Pass
      : ValidationStatus.Fail;

    const message = status === ValidationStatus.Pass
      ? `Compartment ${compartment.name} cumulative load (${currentLoad.toFixed(2)} lbs) is within limit (${maxAllowedLoad.toFixed(2)} lbs)`
      : `Compartment ${compartment.name} cumulative load (${currentLoad.toFixed(2)} lbs) exceeds maximum allowed (${maxAllowedLoad.toFixed(2)} lbs) by ${overageAmount.toFixed(2)} lbs`;

    results.push({
      status,
      constraintType: LoadConstraintType.Cumulative,
      compartmentId: compartment.id!,
      compartmentName: compartment.name,
      currentLoad,
      maxAllowedLoad,
      overageAmount,
      message,
    });
  }

  return results;
}

/**
 * Validates concentrated load constraints for all cargo items in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of concentrated load validation results
 */
export async function validateConcentratedLoad(missionId: number): Promise<ConcentratedLoadValidationResult[]> {
  // 1. Get all cargo items for this mission
  const cargoItemsResponse = await getCargoItemsByMissionId(missionId);
  if (cargoItemsResponse.count === 0) {
    return []; // No cargo items to validate
  }

  const cargoItems = cargoItemsResponse.results.map(result => result.data as DBCargoItem);
  const results: ConcentratedLoadValidationResult[] = [];

  for (const cargoItem of cargoItems) {
    const cargoTypeResult = await getCargoTypeById(cargoItem.cargo_type_id);
    if (cargoTypeResult.count === 0 || !cargoTypeResult.results[0].data) {
      throw new Error(`No cargo type found for cargo item with ID ${cargoItem.id}`);
    }

    const cargoType = cargoTypeResult.results[0].data as DBCargoType;
    const wheelType = cargoType.type as WheelType;

    const concentratedLoadResult = await calculateConcentratedLoad(cargoItem.id!);
    const concentratedLoadValue = concentratedLoadResult.value;

    const touchpointResult = await getTouchpointCompartments(cargoItem.id!, wheelType);

    if (wheelType === 'bulk') {
      // For bulk cargo, check against all overlapping compartments
      for (const compartmentId of touchpointResult.overlappingCompartments) {
        const validationResult = await validateCompartmentConcentratedLoad(
          compartmentId,
          cargoItem.id!,
          concentratedLoadValue
        );

        if (validationResult) {
          results.push(validationResult);
        } else {
          throw new Error(`No validation result found for compartment with ID ${compartmentId}`);
        }
      }
    } else {
      // For wheeled cargo, check each touchpoint against its corresponding compartment
      const touchpointToCompartment = touchpointResult.touchpointToCompartment;

      for (const [_, compartmentId] of Object.entries(touchpointToCompartment)) {

        const validationResult = await validateCompartmentConcentratedLoad(
          compartmentId,
          cargoItem.id!,
          concentratedLoadValue
        );

        if (validationResult) {
          results.push(validationResult);
        } else {
          throw new Error(`No validation result found for compartment with ID ${compartmentId}`);
        }
      }
    }
  }

  return results;
}

/**
 * Helper function to validate concentrated load against a compartment's constraint
 * @param compartmentId - The compartment ID to validate against
 * @param cargoItemId - The cargo item ID being validated
 * @param concentratedLoadValue - The calculated concentrated load value
 * @returns Validation result or null if compartment not found
 */
async function validateCompartmentConcentratedLoad(
  compartmentId: number,
  cargoItemId: number,
  concentratedLoadValue: number
): Promise<ConcentratedLoadValidationResult | null> {
  const compartmentResult = await getCompartmentById(compartmentId);
  if (compartmentResult.count === 0 || !compartmentResult.results[0].data) {
    return null;
  }
  const compartment = compartmentResult.results[0].data as DBCompartment;

  const constraintsResult = await getLoadConstraintsByCompartmentId(compartmentId);
  if (constraintsResult.count === 0 || !constraintsResult.results[0].data) {
    return null;
  }
  const constraints = constraintsResult.results[0].data as DBLoadConstraint;
  const maxAllowedLoad = constraints.max_concentrated_load || 0;

  const overageAmount = Math.max(0, concentratedLoadValue - maxAllowedLoad);

  const status = concentratedLoadValue <= maxAllowedLoad
    ? ValidationStatus.Pass
    : ValidationStatus.Fail;

  const message = status === ValidationStatus.Pass
    ? `Cargo item ${cargoItemId} concentrated load (${concentratedLoadValue.toFixed(2)} lbs/sq.in) is within limit (${maxAllowedLoad.toFixed(2)} lbs/sq.in) for compartment ${compartment.name}`
    : `Cargo item ${cargoItemId} concentrated load (${concentratedLoadValue.toFixed(2)} lbs/sq.in) exceeds maximum allowed (${maxAllowedLoad.toFixed(2)} lbs/sq.in) for compartment ${compartment.name} by ${overageAmount.toFixed(2)} lbs/sq.in`;

  return {
    status,
    constraintType: LoadConstraintType.Concentrated,
    compartmentId,
    compartmentName: compartment.name,
    cargoItemId,
    currentLoad: concentratedLoadValue,
    maxAllowedLoad,
    overageAmount,
    message,
  };
}
