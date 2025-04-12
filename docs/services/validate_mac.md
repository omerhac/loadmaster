# MAC Validation Service Technical Specification

## Overview

The MAC Validation Service provides functionality to validate whether a given MAC (Mean Aerodynamic Chord) value for an aircraft falls within allowable limits based on the aircraft's weight. The service validates both standalone MAC values and MAC values for specific mission configurations.

## Dependencies

- `AllowedMacConstraintOperations` for retrieving MAC constraints from the database
- `MacCalculationService` for mission MAC validation

## API

### Types

```typescript
/**
 * Represents the result of a MAC validation
 */
export interface MacValidationResult {
  isValid: boolean;       // Whether the MAC value is valid
  errorMessage?: string;  // Error message if invalid
  percentage?: number;    // Percentage of MAC (used in error messages)
  lowerLimit?: number;    // Lower limit of allowed MAC range
  upperLimit?: number;    // Upper limit of allowed MAC range
}
```

### Functions

```typescript
/**
 * Validates if a given MAC percentage is within allowed limits for a specific aircraft weight
 * 
 * @param aircraft - The aircraft to validate (id or object with id)
 * @param macPercentage - The MAC percentage to validate
 * @param weightInPounds - The aircraft weight in pounds
 * @returns A validation result object
 */
export function validateMac(
  aircraft: number | { id: number },
  macPercentage: number,
  weightInPounds: number
): Promise<MacValidationResult>

/**
 * Validates if the MAC for a mission is within allowed limits
 * 
 * @param missionId - The ID of the mission to validate
 * @param fuelStateId - The ID of the fuel state to use for validation
 * @returns A validation result object
 */
export function validateMissionMac(
  missionId: number,
  fuelStateId: number
): Promise<MacValidationResult>
```

## Implementation Details

### validateMac

```typescript
export async function validateMac(
  aircraft: number | { id: number },
  macPercentage: number,
  weightInPounds: number
): Promise<MacValidationResult> {
  try {
    // Extract aircraft ID
    const aircraftId = typeof aircraft === 'number' ? aircraft : aircraft.id;
    
    // Retrieve MAC constraints for the aircraft
    const constraints = await AllowedMacConstraintOperations.getAllowedMacConstraints(aircraftId);
    
    // Handle case with no constraints
    if (!constraints || constraints.length === 0) {
      return {
        isValid: false,
        errorMessage: `No MAC constraints found for aircraft ${aircraftId}`,
      };
    }
    
    // Find the applicable constraint based on weight
    const applicableConstraint = constraints.find(constraint => {
      // Check if weight is within this constraint's range
      return (constraint.lower_weight_bound <= weightInPounds && 
              (constraint.upper_weight_bound === null || constraint.upper_weight_bound >= weightInPounds));
    });
    
    // Handle case with no applicable constraint for the weight
    if (!applicableConstraint) {
      return {
        isValid: false,
        errorMessage: `No MAC constraint found for aircraft ${aircraftId} at weight ${weightInPounds} lbs`,
      };
    }
    
    // Check if MAC percentage is within allowed limits
    const isValid = (
      macPercentage >= applicableConstraint.lower_mac_bound && 
      macPercentage <= applicableConstraint.upper_mac_bound
    );
    
    // Return validation result with detailed info
    return {
      isValid,
      percentage: macPercentage,
      lowerLimit: applicableConstraint.lower_mac_bound,
      upperLimit: applicableConstraint.upper_mac_bound,
      errorMessage: isValid ? undefined : 
        `MAC ${macPercentage}% is outside allowed range (${applicableConstraint.lower_mac_bound}% - ${applicableConstraint.upper_mac_bound}%) for weight ${weightInPounds} lbs`
    };
  } catch (error) {
    // Handle errors from database operations
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during MAC validation';
    return {
      isValid: false,
      errorMessage
    };
  }
}
```

### validateMissionMac

```typescript
export async function validateMissionMac(
  missionId: number, 
  fuelStateId: number
): Promise<MacValidationResult> {
  try {
    // 1. Get mission by ID to ensure it exists
    const missionResponse = await getMissionById(missionId);
    if (missionResponse.count === 0 || !missionResponse.results[0].data) {
      return {
        isValid: false,
        errorMessage: `Mission with ID ${missionId} not found`
      };
    }
    
    // 2. Get fuel state to ensure it exists
    const fuelStateResponse = await getFuelStateById(fuelStateId);
    if (fuelStateResponse.count === 0 || !fuelStateResponse.results[0].data) {
      return {
        isValid: false,
        errorMessage: `Fuel state with ID ${fuelStateId} not found`
      };
    }
    
    const mission = missionResponse.results[0].data;
    const fuelState = fuelStateResponse.results[0].data;
    
    // 3. Calculate the MAC and weight using MacCalculationService
    const macResult = await calculateMissionMac(missionId, fuelStateId);
    
    // 4. Validate the MAC using the standard validate function
    return validateMac(
      mission.aircraft_id,
      macResult.macPercentage,
      macResult.totalWeight
    );
  } catch (error) {
    // Handle errors from database operations or MAC calculation
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during mission MAC validation';
    return {
      isValid: false,
      errorMessage
    };
  }
}
```

## Error Handling

- If no constraints are found for an aircraft, returns an invalid result with appropriate error message
- If no constraint applies to the given weight, returns an invalid result with weight-specific error message
- Database errors are caught and converted to invalid results with the error message included
- For missing missions or fuel states, returns specific error messages
- When MAC is outside allowed range, provides detailed information about limits and actual values