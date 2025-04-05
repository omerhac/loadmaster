# MAC Validation Service Technical Specification

## Overview
The MAC (Mean Aerodynamic Chord) Validation Service provides functionality to validate if a given MAC value is within allowed limits for a specific aircraft weight. This service uses the `allowed_mac_constraints` table to determine the valid MAC range based on aircraft gross weight.

## Purpose
Ensure that aircraft loading configurations maintain a MAC percentage within safe operational limits based on the current gross weight of the aircraft.

## Dependencies
- Database service
- AllowedMacConstraint operations

## Interface

```typescript
interface MacValidationResult {
  isValid: boolean;
  currentMac: number;
  minAllowedMac: number;
  maxAllowedMac: number;
  weightUsedForConstraint: number;
  actualWeight: number;
  message?: string;
}

interface MacValidationService {
  validateMac(grossWeight: number, macPercent: number): Promise<MacValidationResult>;
  validateMissionMac(missionId: number): Promise<MacValidationResult>;
}
```

## Implementation Details

### validateMac
The main validation function will:
1. Take gross aircraft weight and MAC percentage as inputs
2. Query the database for applicable constraints using `getAllowedMacConstraintByWeight`
3. Determine if the MAC percentage is within the min/max range
4. Return a comprehensive validation result

```typescript
async function validateMac(
  grossWeight: number, 
  macPercent: number
): Promise<MacValidationResult> {
  // Get applicable constraints for the weight
  const constraintResponse = await getAllowedMacConstraintByWeight(grossWeight);
  
  if (constraintResponse.count === 0) {
    return {
      isValid: false,
      currentMac: macPercent,
      minAllowedMac: 0,
      maxAllowedMac: 0,
      weightUsedForConstraint: 0,
      actualWeight: grossWeight,
      message: "No MAC constraints found for the specified weight"
    };
  }
  
  const constraint = constraintResponse.rows[0] as AllowedMacConstraint;
  
  const isValid = macPercent >= constraint.min_mac && macPercent <= constraint.max_mac;
  
  return {
    isValid,
    currentMac: macPercent,
    minAllowedMac: constraint.min_mac,
    maxAllowedMac: constraint.max_mac,
    weightUsedForConstraint: constraint.gross_aircraft_weight,
    actualWeight: grossWeight,
    message: isValid ? 
      "MAC is within allowed limits" : 
      `MAC is outside allowed limits (${constraint.min_mac}% - ${constraint.max_mac}%)`
  };
}
```

### validateMissionMac
A convenience function to validate the MAC of an existing mission:
1. Retrieve the mission's weight and MAC from the mission table
2. Call `validateMac` with these values
3. Return the validation result

## Error Handling
- If no constraints exist, return a validation result with `isValid: false` and an appropriate message
- If database operations fail, throw appropriate errors with context