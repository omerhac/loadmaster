# Floor Load Validation Service Technical Specification

## Overview
The Floor Load Validation Service provides functionality to validate cargo loading against various floor load constraints in aircraft compartments. This ensures that aircraft structural integrity is maintained during loading operations by preventing floor overload conditions. The service validates cumulative load, concentrated load, and running load constraints for all cargo items in a mission.

## Requirements

1. **Constraint Validation Framework**
   - Validate multiple constraint types with a single function call
   - Return detailed validation results with pass/fail status
   - Identify specific violations by compartment and constraint type
   - Support mission-level validation across all cargo items

2. **Cumulative Load Validation**
   - Calculate and validate total weight in each compartment against maximum allowable weight
   - Sum load contributions from all cargo items in the compartment
   - Report violations with specific weight overages

3. **Concentrated Load Validation**
   - Validate individual cargo item touchpoint loads against maximum concentrated load constraints
   - Account for cargo type (bulk, 2-wheeled, 4-wheeled) when calculating concentrated loads
   - Handle different constraint limits for each compartment

4. **Running Load Validation**
   - Validate running loads against appropriate treadway/between treadways constraints
   - Determine applicable constraint type based on wheel positioning:
     - Bulk items: use between treadways constraint
     - 2-wheeled items: verify both wheels are on treadways
     - 4-wheeled items: verify wheels on each side are on treadways
   - Sum running load contributions from overlapping cargo items

## Type Definitions

```typescript
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
 * Running load data structure for a compartment
 */
export interface CompartmentRunningLoad {
  compartmentId: number;
  treadwayLoad: number;
  betweenTreadwayLoad: number;
}

/**
 * Comprehensive mission validation results
 */
export interface MissionValidationResults {
  missionId: number;
  status: ValidationStatus;
  results: LoadValidationResult[];
}
```

## API

```typescript
/**
 * Validates all load constraints for a mission
 * @param missionId - The ID of the mission to validate
 * @returns Comprehensive validation results with pass/fail status
 */
export function validateMissionLoadConstraints(missionId: number): Promise<MissionValidationResults>

/**
 * Validates cumulative load constraints for all compartments in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of cumulative load validation results
 */
export function validateCumulativeLoad(missionId: number): Promise<CumulativeLoadValidationResult[]>

/**
 * Validates concentrated load constraints for all cargo items in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of concentrated load validation results
 */
export function validateConcentratedLoad(missionId: number): Promise<ConcentratedLoadValidationResult[]>

/**
 * Validates running load constraints for all cargo items in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of running load validation results
 */
export function validateRunningLoad(missionId: number): Promise<RunningLoadValidationResult[]>
```

## Database Dependencies

The service relies on the following database tables:
- `mission`: Contains mission details and aircraft references
- `cargo_item`: Stores cargo item details including weight, dimensions, and position
- `compartment`: Defines compartment boundaries and properties
- `load_constraints`: Stores constraint values for each compartment

## Implementation Details

### Helper Functions

### Main Validation Functions

#### validateMissionLoadConstraints

```typescript
export async function validateMissionLoadConstraints(missionId: number): Promise<MissionValidationResults> {
  // 1. Validate mission exists
  const mission = await getMissionById(missionId);
  if (!mission) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }

  // 2. Run all validation types
  const [cumulativeResults, concentratedResults, runningResults] = await Promise.all([
    validateCumulativeLoad(missionId),
    validateConcentratedLoad(missionId),
    validateRunningLoad(missionId)
  ]);

  // 3. Combine all results
  const allResults: LoadValidationResult[] = [
    ...cumulativeResults,
    ...concentratedResults,
    ...runningResults
  ];

  // 4. Determine overall status - fails if any constraint fails
  const overallStatus = allResults.some(result => result.status === ValidationStatus.Fail)
    ? ValidationStatus.Fail
    : ValidationStatus.Pass;

  // 5. Return comprehensive results
  return {
    missionId,
    status: overallStatus,
    results: allResults
  };
}
```

#### validateCumulativeLoad

```typescript
/**
 * Validates cumulative load constraints for all compartments in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of cumulative load validation results
 */
export async function validateCumulativeLoad(missionId: number): Promise<CumulativeLoadValidationResult[]> {
  // 1. Get aggregated load by compartment from FloorLoadCalculationService
  const compartmentLoads = await aggregateCumulativeLoadByCompartment(missionId);
  
  // 2. Get all relevant compartments for the mission's aircraft
  const mission = await getMissionById(missionId);
  if (!mission) {
    throw new Error(`Mission with ID ${missionId} not found`);
  }
  
  const aircraft = await getAircraftById(mission.aircraft_id);
  const compartments = await getCompartmentsByAircraftId(aircraft.id);
  
  // 3. Get load constraints for each compartment
  const loadConstraints = await Promise.all(
    compartments.map(compartment => 
      getLoadConstraintsByCompartmentId(compartment.id)
    )
  );
  
  // 4. Initialize results array
  const results: CumulativeLoadValidationResult[] = [];
  
  // 5. Validate each compartment against its constraints
  compartments.forEach((compartment, index) => {
    const currentLoad = compartmentLoads.get(compartment.id) || 0;
    const constraints = loadConstraints[index];
    const maxAllowedLoad = constraints?.maximum_cumulative_load || 0;
    
    // Calculate overage if any
    const overageAmount = Math.max(0, currentLoad - maxAllowedLoad);
    
    // Determine validation status
    const status = currentLoad <= maxAllowedLoad 
      ? ValidationStatus.Pass 
      : ValidationStatus.Fail;
    
    // Construct validation message
    const message = status === ValidationStatus.Pass
      ? `Compartment ${compartment.name} cumulative load (${currentLoad.toFixed(2)} lbs) is within limit (${maxAllowedLoad.toFixed(2)} lbs)`
      : `Compartment ${compartment.name} cumulative load (${currentLoad.toFixed(2)} lbs) exceeds maximum allowed (${maxAllowedLoad.toFixed(2)} lbs) by ${overageAmount.toFixed(2)} lbs`;
    
    // Add result
    results.push({
      status,
      constraintType: LoadConstraintType.Cumulative,
      compartmentId: compartment.id,
      compartmentName: compartment.name,
      currentLoad,
      maxAllowedLoad,
      overageAmount,
      message
    });
  });
  
  return results;
}
```

#### validateConcentratedLoad

```typescript
/**
 * Validates concentrated load constraints for all cargo items in a mission
 * @param missionId - The ID of the mission to validate
 * @returns Array of concentrated load validation results
 */
export async function validateConcentratedLoad(missionId: number): Promise<ConcentratedLoadValidationResult[]> {
  // 1. Get all cargo items for this mission
  const cargoItemsResponse = await getCargoItemsByMissionId(missionId);
  if (cargoItemsResponse.count === 0) {
    return [];
  }
  
  const cargoItems = cargoItemsResponse.results.map(result => result.data as DBCargoItem);
  const results: ConcentratedLoadValidationResult[] = [];
  
  // Process each cargo item
  for (const cargoItem of cargoItems) {
    // Get cargo type information
    const cargoTypeResult = await getCargoTypeById(cargoItem.cargo_type_id);
    if (cargoTypeResult.count === 0 || !cargoTypeResult.results[0].data) {
      continue;
    }
    
    const cargoType = cargoTypeResult.results[0].data as DBCargoType;
    const wheelType = cargoType.type as WheelType;
    
    // Calculate concentrated load for the cargo item
    const concentratedLoadResult = await calculateConcentratedLoad(cargoItem.id!);
    const concentratedLoadValue = concentratedLoadResult.value;
    
    // Get touchpoint compartment mapping
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
        }
        else {
            // raise error
        }
      }
    } else {
      // For wheeled cargo, check each touchpoint against its corresponding compartment
      const touchpointToCompartment = touchpointResult.touchpointToCompartment;
      
      // Process each touchpoint
      for (const [position, compartmentId] of Object.entries(touchpointToCompartment)) {
        if (compartmentId) {
          const validationResult = await validateCompartmentConcentratedLoad(
            compartmentId,
            cargoItem.id!,
            concentratedLoadValue
          );
          
          if (validationResult) {
            results.push(validationResult);
          } else{
            // raise error
          }
          
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
  // Get compartment details
  const compartment = await getCompartmentById(compartmentId);
  if (!compartment) {
    return null;
  }
  
  // Get load constraints for the compartment
  const constraints = await getLoadConstraintsByCompartmentId(compartmentId);
  if (!constraints) {
    return null;
  }
  
  const maxAllowedLoad = constraints.maximum_concentrated_load;
  
  // Calculate overage if any
  const overageAmount = Math.max(0, concentratedLoadValue - maxAllowedLoad);
  
  // Determine validation status
  const status = concentratedLoadValue <= maxAllowedLoad 
    ? ValidationStatus.Pass 
    : ValidationStatus.Fail;
  
  // Construct validation message
  const message = status === ValidationStatus.Pass
    ? `Cargo item ${cargoItemId} concentrated load (${concentratedLoadValue.toFixed(2)} lbs/sq.in) is within limit (${maxAllowedLoad.toFixed(2)} lbs/sq.in) for compartment ${compartment.name}`
    : `Cargo item ${cargoItemId} concentrated load (${concentratedLoadValue.toFixed(2)} lbs/sq.in) exceeds maximum allowed (${maxAllowedLoad.toFixed(2)} lbs/sq.in) for compartment ${compartment.name} by ${overageAmount.toFixed(2)} lbs/sq.in`;
  
  // Return validation result
  return {
    status,
    constraintType: LoadConstraintType.Concentrated,
    compartmentId,
    compartmentName: compartment.name,
    cargoItemId,
    currentLoad: concentratedLoadValue,
    maxAllowedLoad,
    overageAmount,
    message
  };
}
```

## Usage Examples

```typescript
// Validate all constraints for a mission
const validationResults = await validateMissionLoadConstraints(missionId);

// Check if mission passes all validations
if (validationResults.status === ValidationStatus.Pass) {
  console.log('Mission passes all load constraint validations');
} else {
  // Get all failures
  const failures = validationResults.results.filter(
    result => result.status === ValidationStatus.Fail
  );
  
  console.log('Mission failed the following validations:');
  failures.forEach(failure => {
    console.log(failure.message);
  });
}

// Get cumulative loads by compartment for reporting
const compartmentLoads = await FloorLoadCalculationService.aggregateCumulativeLoadByCompartment(missionId);
console.log('Compartment loads:');
for (const [compartmentId, load] of compartmentLoads.entries()) {
  console.log(`Compartment ${compartmentId}: ${load.toFixed(2)} lbs`);
}
```
