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

/**
 * Determines if wheels are on treadways for a cargo item
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel type of the cargo
 * @param aircraftId - The ID of the aircraft
 * @returns Whether the wheels are on treadways according to cargo type rules
 */
export function isCargoOnTreadway(
  cargoItemId: number, 
  wheelType: WheelType, 
  aircraftId: number
): Promise<boolean>
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

#### isCargoOnTreadway

```typescript
/**
 * Determines if a cargo item's wheels are on treadways according to cargo type rules
 * @param cargoItemId - The ID of the cargo item
 * @param wheelType - The wheel configuration type
 * @param aircraftId - The ID of the aircraft
 * @returns Whether the cargo is on treadway(s) according to rules for its type
 */
export async function isCargoOnTreadway(
  cargoItemId: number, 
  wheelType: WheelType, 
  aircraftId: number
): Promise<boolean> {
  // Bulk items are always considered between treadways
  if (wheelType === 'bulk') {
    return false;
  }
  
  // Get wheel touchpoints
  const touchpoints = await getWheelTouchpoints(cargoItemId, wheelType);
  
  if (wheelType === '2_wheeled') {
    // For 2-wheeled cargo, both wheels must be on treadways
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
    
    const frontOnTreadway = await isTouchpointOnTreadway(frontWheelSpan, aircraftId);
    const backOnTreadway = await isTouchpointOnTreadway(backWheelSpan, aircraftId);
    
    // Both wheels must be on treadways
    return frontOnTreadway && backOnTreadway;
  } 
  
  if (wheelType === '4_wheeled') {
    // For 4-wheeled cargo, all wheels on at least one side must be on treadways
    
    // Left side wheels
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
    
    // Right side wheels
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
    
    // Check if all wheels on either side are on treadways
    const leftSideOnTreadway = 
      await isTouchpointOnTreadway(frontLeftWheelSpan, aircraftId) && 
      await isTouchpointOnTreadway(backLeftWheelSpan, aircraftId);
    
    const rightSideOnTreadway = 
      await isTouchpointOnTreadway(frontRightWheelSpan, aircraftId) && 
      await isTouchpointOnTreadway(backRightWheelSpan, aircraftId);
    
    // both sides must be fully on treadways
    // as the running load as the same on both
    // so the more strict constraint (non-treadway) applies
    return leftSideOnTreadway && rightSideOnTreadway;
  }
  
  // raise error
}
```

#### calculateRunningLoadsByCategory

```typescript
/**
 * Calculates running loads by category (treadway vs between treadway) for all compartments
 * @param missionId - The ID of the mission
 * @returns Map of compartment IDs to their running loads by category
 */
export async function calculateRunningLoadsByCategory(
  missionId: number
): Promise<Map<number, CompartmentRunningLoad>> {
  // 1. Get necessary data
  const mission = await getMissionById(missionId);
  const cargoItems = await getCargoItemsByMissionId(missionId);
  
  // 2. Initialize result map
  const runningLoadByCompartment = new Map<number, CompartmentRunningLoad>();
  
  // 3. Process each cargo item
  for (const cargoItem of cargoItems) {
    // Calculate running load for this cargo
    const runningLoad = await calculateRunningLoad(cargoItem.id);
    
    // Get compartments this cargo overlaps with
    const touchpointResult = await getTouchpointCompartments(
      cargoItem.id,
      cargoItem.type as WheelType
    );
    
    // Determine if cargo is on treadway
    const onTreadway = await isCargoOnTreadway(
      cargoItem.id,
      cargoItem.type as WheelType,
      mission.aircraft_id
    );
    
    // Add running load to each affected compartment in the appropriate category
    for (const compartmentId of touchpointResult.overlappingCompartments) {
      // Initialize compartment running load data if not exists
      if (!runningLoadByCompartment.has(compartmentId)) {
        runningLoadByCompartment.set(compartmentId, {
          compartmentId,
          treadwayLoad: 0,
          betweenTreadwayLoad: 0
        });
      }
      
      // Update appropriate load category
      const compartmentLoad = runningLoadByCompartment.get(compartmentId)!;
      if (onTreadway) {
        compartmentLoad.treadwayLoad += runningLoad.value;
      } else {
        compartmentLoad.betweenTreadwayLoad += runningLoad.value;
      }
    }
  }
  
  return runningLoadByCompartment;
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

#### validateCumulativeLoad

```typescript
export async function validateCumulativeLoad(missionId: number): Promise<CumulativeLoadValidationResult[]> {
  // 1. Get mission and compartment information
  const mission = await getMissionById(missionId);
  const compartments = await getCompartmentsByAircraftId(mission.aircraft_id);
  
  // 2. Get constraint data for all compartments
  const constraintPromises = compartments.map(compartment => 
    getLoadConstraintsByCompartmentId(compartment.id)
  );
  const compartmentConstraints = await Promise.all(constraintPromises);
  
  // 3. Calculate aggregated loads by compartment using the helper function
  const totalLoadByCompartment = await aggregateCumulativeLoadByCompartment(missionId);
  
  // 4. Compare loads against constraints and generate results
  const results: CumulativeLoadValidationResult[] = [];
  
  compartmentConstraints.forEach((constraints, index) => {
    const compartment = compartments[index];
    const compartmentId = compartment.id;
    const currentLoad = totalLoadByCompartment.get(compartmentId) || 0;
    
    // Find cumulative weight constraint
    const cumulativeConstraint = constraints.find(c => 
      c.constraint_type === LoadConstraintType.Cumulative
    );
    
    if (cumulativeConstraint) {
      const maxAllowedLoad = cumulativeConstraint.max_cumulative_weight;
      const overageAmount = Math.max(0, currentLoad - maxAllowedLoad);
      const status = overageAmount > 0 ? ValidationStatus.Fail : ValidationStatus.Pass;
      
      results.push({
        status,
        constraintType: LoadConstraintType.Cumulative,
        compartmentId,
        compartmentName: compartment.name,
        currentLoad,
        maxAllowedLoad,
        overageAmount,
        message: status === ValidationStatus.Fail
          ? `Compartment ${compartment.name} exceeds maximum cumulative weight by ${overageAmount.toFixed(2)} lbs`
          : `Compartment ${compartment.name} cumulative weight is within limits`
      });
      // else raise error
    }
  });
  
  return results;
}
```

#### validateConcentratedLoad

```typescript
export async function validateConcentratedLoad(missionId: number): Promise<ConcentratedLoadValidationResult[]> {
  // 1. Get mission data
  const mission = await getMissionById(missionId);
  const cargoItems = await getCargoItemsByMissionId(missionId);
  const compartments = await getCompartmentsByAircraftId(mission.aircraft_id);
  
  // 2. Create maps for quick lookup
  const compartmentMap = new Map(compartments.map(c => [c.id, c]));
  
  // 3. Get constraint data for concentrated loads
  const constraintPromises = compartments.map(compartment => 
    getLoadConstraintsByCompartmentId(compartment.id)
  );
  const compartmentConstraints = await Promise.all(constraintPromises);
  
  // Build constraint map for concentrated loads
  const constraintMap = new Map();
  compartmentConstraints.forEach((constraints, index) => {
    const compartmentId = compartments[index].id;
    const concentratedConstraint = constraints.find(c => 
      c.constraint_type === LoadConstraintType.Concentrated
    );
    
    if (concentratedConstraint) {
      constraintMap.set(compartmentId, concentratedConstraint);
    }
    // else raise error
  });
  
  // 4. Validate each cargo item's concentrated load against constraints
  const results: ConcentratedLoadValidationResult[] = [];
  
  for (const cargoItem of cargoItems) {
    // Calculate concentrated load using existing service
    const concentratedLoad = await calculateConcentratedLoad(cargoItem.id);
    
    // Get compartments affected by this cargo item
    const touchpointResult = await getTouchpointCompartments(
      cargoItem.id, 
      cargoItem.type as WheelType
    );
    
    // Check each affected compartment against its constraint
    for (const compartmentId of touchpointResult.overlappingCompartments) {
      const constraint = constraintMap.get(compartmentId);
      const compartment = compartmentMap.get(compartmentId);
      
      if (constraint && compartment) {
        const maxAllowedLoad = constraint.max_concentrated_load;
        const currentLoad = concentratedLoad.value;
        const overageAmount = Math.max(0, currentLoad - maxAllowedLoad);
        const status = overageAmount > 0 ? ValidationStatus.Fail : ValidationStatus.Pass;
        
        results.push({
          status,
          constraintType: LoadConstraintType.Concentrated,
          compartmentId,
          compartmentName: compartment.name,
          cargoItemId: cargoItem.id,
          currentLoad,
          maxAllowedLoad,
          overageAmount,
          message: status === ValidationStatus.Fail
            ? `Cargo item ${cargoItem.id} exceeds maximum concentrated load in compartment ${compartment.name} by ${overageAmount.toFixed(2)} lbs/sq.in`
            : `Cargo item ${cargoItem.id} concentrated load is within limits for compartment ${compartment.name}`
        });
      }
    }
  }
  
  return results;
}
```

#### validateRunningLoad

```typescript
export async function validateRunningLoad(missionId: number): Promise<RunningLoadValidationResult[]> {
  // 1. Get mission and compartment data
  const mission = await getMissionById(missionId);
  const compartments = await getCompartmentsByAircraftId(mission.aircraft_id);
  const compartmentMap = new Map(compartments.map(c => [c.id, c]));
  
  // 2. Get constraint data for running loads
  const constraintPromises = compartments.map(compartment => 
    getLoadConstraintsByCompartmentId(compartment.id)
  );
  const compartmentConstraints = await Promise.all(constraintPromises);
  
  // Build constraint maps for treadway and between-treadway constraints
  const treadwayConstraintMap = new Map();
  const betweenTreadwayConstraintMap = new Map();
  
  compartmentConstraints.forEach((constraints, index) => {
    const compartmentId = compartments[index].id;
    const runningConstraint = constraints.find(c => 
      c.constraint_type === LoadConstraintType.Running
    );
    
    if (runningConstraint) {
      treadwayConstraintMap.set(compartmentId, runningConstraint.max_running_load_treadway);
      betweenTreadwayConstraintMap.set(compartmentId, runningConstraint.max_running_load_between_treadways);
    }
  });
  
  // 3. Calculate running loads by category
  const runningLoadByCompartment = await calculateRunningLoadsByCategory(missionId);
  
  // 4. Validate against constraints
  const results: RunningLoadValidationResult[] = [];
  
  for (const [compartmentId, loadData] of runningLoadByCompartment.entries()) {
    const compartment = compartmentMap.get(compartmentId);
    if (!compartment) continue;
    
    // Validate treadway running load
    const maxTreadwayLoad = treadwayConstraintMap.get(compartmentId);
    if (maxTreadwayLoad !== undefined && loadData.treadwayLoad > 0) {
      const currentLoad = loadData.treadwayLoad;
      const overageAmount = Math.max(0, currentLoad - maxTreadwayLoad);
      const status = overageAmount > 0 ? ValidationStatus.Fail : ValidationStatus.Pass;
      
      results.push({
        status,
        constraintType: LoadConstraintType.Running,
        compartmentId,
        compartmentName: compartment.name,
        currentLoad,
        maxAllowedLoad: maxTreadwayLoad,
        overageAmount,
        loadCategory: RunningLoadCategory.Treadway,
        message: status === ValidationStatus.Fail
          ? `Compartment ${compartment.name} exceeds maximum treadway running load by ${overageAmount.toFixed(2)} lbs/in`
          : `Compartment ${compartment.name} treadway running load is within limits`
      });
    }
    
    // Validate between-treadway running load
    const maxBetweenTreadwayLoad = betweenTreadwayConstraintMap.get(compartmentId);
    if (maxBetweenTreadwayLoad !== undefined && loadData.betweenTreadwayLoad > 0) {
      const currentLoad = loadData.betweenTreadwayLoad;
      const overageAmount = Math.max(0, currentLoad - maxBetweenTreadwayLoad);
      const status = overageAmount > 0 ? ValidationStatus.Fail : ValidationStatus.Pass;
      
      results.push({
        status,
        constraintType: LoadConstraintType.Running,
        compartmentId,
        compartmentName: compartment.name,
        currentLoad,
        maxAllowedLoad: maxBetweenTreadwayLoad,
        overageAmount,
        loadCategory: RunningLoadCategory.BetweenTreadway,
        message: status === ValidationStatus.Fail
          ? `Compartment ${compartment.name} exceeds maximum between-treadway running load by ${overageAmount.toFixed(2)} lbs/in`
          : `Compartment ${compartment.name} between-treadway running load is within limits`
      });
    }
  }
  
  return results;
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

// Get running loads by category for each compartment
const runningLoads = await calculateRunningLoadsByCategory(missionId);
console.log('Running loads by compartment:');
for (const [compartmentId, loadData] of runningLoads.entries()) {
  console.log(`Compartment ${compartmentId}:`);
  console.log(`  Treadway: ${loadData.treadwayLoad.toFixed(2)} lbs/in`);
  console.log(`  Between treadway: ${loadData.betweenTreadwayLoad.toFixed(2)} lbs/in`);
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