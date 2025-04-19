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

/**
 * Aggregates compartment loads for all cargo items in a mission
 * @param missionId - The ID of the mission
 * @returns Map of compartment IDs to their total cumulative loads
 */
export function aggregateCumulativeLoadByCompartment(missionId: number): Promise<Map<number, number>>
```

## Database Dependencies

The service relies on the following database tables:
- `mission`: Contains mission details and aircraft references
- `cargo_item`: Stores cargo item details including weight, dimensions, and position
- `compartment`: Defines compartment boundaries and properties
- `load_constraints`: Stores constraint values for each compartment

## Implementation Details

### Helper Functions

#### aggregateCumulativeLoadByCompartment

```typescript
/**
 * Aggregates loads by compartment across all cargo items in a mission
 * Reuses calculateLoadPerCompartment from FloorLoadCalculationService
 * @param missionId - The ID of the mission
 * @returns Map of compartment IDs to their total loads
 */
export async function aggregateCumulativeLoadByCompartment(missionId: number): Promise<Map<number, number>> {
  // 1. Get all cargo items for this mission
  const cargoItems = await getCargoItemsByMissionId(missionId);
  
  // 2. Calculate load per compartment for each cargo item using the existing service
  const loadPromises = cargoItems.map(cargoItem => 
    calculateLoadPerCompartment(cargoItem.id)
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
```

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
const compartmentLoads = await aggregateCumulativeLoadByCompartment(missionId);
console.log('Compartment loads:');
for (const [compartmentId, load] of compartmentLoads.entries()) {
  console.log(`Compartment ${compartmentId}: ${load.toFixed(2)} lbs`);
}
```

## Error Handling

The service implements robust error handling:

1. Validation of input parameters to ensure they meet expected formats
2. Proper error propagation when underlying services fail
3. Graceful handling of missing database records with informative error messages
4. Structured validation results that clearly communicate constraint failures

## Performance Considerations

The validation service employs several optimizations:

1. Parallel validation of different constraint types
2. Caching of constraint data to minimize database queries
3. Efficient aggregation of loads by compartment
4. Reuse of wheel touchpoint calculations across different validation steps

These optimizations ensure that validation operations complete quickly even for missions with large numbers of cargo items.