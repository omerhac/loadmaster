/**
 * MAC Validation Service
 *
 * Validates if a given MAC (Mean Aerodynamic Chord) value is within allowed limits
 * for a specific aircraft weight using the allowed_mac_constraints table.
 */

import { getAllowedMacConstraintByWeight } from './db/operations/AllowedMacConstraintOperations';
import { AllowedMacConstraint } from './db/operations/types';
import { calculateMACPercent, calculateTotalAircraftWeight } from './mac/MacCalculationService';

/**
 * Result of a MAC validation operation
 */
export interface MacValidationResult {
  isValid: boolean;
  currentMac: number;
  minAllowedMac: number;
  maxAllowedMac: number;
  weightUsedForConstraint: number;
  actualWeight: number;
  message?: string;
}

/**
 * Service for validating MAC values against constraints
 */
export class MacValidationService {
  /**
   * Validates if a given MAC percentage is within the allowed range for the specified gross weight
   *
   * @param grossWeight - The gross weight of the aircraft in appropriate units
   * @param macPercent - The MAC percentage to validate
   * @returns A validation result object
   */
  public async validateMac(
    grossWeight: number,
    macPercent: number
  ): Promise<MacValidationResult> {
    try {
      // Get applicable constraints for the weight
      const constraintResponse = await getAllowedMacConstraintByWeight(grossWeight);

      if (constraintResponse.count === 0 || !constraintResponse.results || constraintResponse.results.length === 0) {
        return {
          isValid: false,
          currentMac: macPercent,
          minAllowedMac: 0,
          maxAllowedMac: 0,
          weightUsedForConstraint: 0,
          actualWeight: grossWeight,
          message: 'No MAC constraints found for the specified weight',
        };
      }

      const resultItem = constraintResponse.results[0];
      if (!resultItem || !resultItem.data) {
        return {
          isValid: false,
          currentMac: macPercent,
          minAllowedMac: 0,
          maxAllowedMac: 0,
          weightUsedForConstraint: 0,
          actualWeight: grossWeight,
          message: 'Error retrieving MAC constraints',
        };
      }

      const constraint = resultItem.data as AllowedMacConstraint;

      const isValid = macPercent >= constraint.min_mac && macPercent <= constraint.max_mac;

      return {
        isValid,
        currentMac: macPercent,
        minAllowedMac: constraint.min_mac,
        maxAllowedMac: constraint.max_mac,
        weightUsedForConstraint: constraint.gross_aircraft_weight,
        actualWeight: grossWeight,
        message: isValid ?
          'MAC is within allowed limits' :
          `MAC is outside allowed limits (${constraint.min_mac}% - ${constraint.max_mac}%)`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the MAC of an existing mission
   *
   * @param missionId - The ID of the mission to validate
   * @returns A validation result object
   */
  public async validateMissionMac(missionId: number): Promise<MacValidationResult> {
    try {
      // Get mission weight and MAC using MacCalculationService instead of direct DB query
      const totalWeight = await calculateTotalAircraftWeight(missionId);
      const macPercent = await calculateMACPercent(missionId);

      // Validate the mission's MAC
      return this.validateMac(totalWeight, macPercent);
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Singleton instance of the MAC validation service
 */
export const macValidationService = new MacValidationService();
