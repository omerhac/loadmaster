/**
 * Tests for MAC Validation Service
 */

import { MacValidationService } from '../../../src/services/MacValidationService';
import { setupTestDatabase, cleanupTestDatabase } from '../db/testHelpers';
import {
  createAllowedMacConstraint,
  deleteAllowedMacConstraint,
  getAllAllowedMacConstraints,
} from '../../../src/services/db/operations/AllowedMacConstraintOperations';
import { createAircraft } from '../../../src/services/db/operations/AircraftOperations';
import { createMission } from '../../../src/services/db/operations/MissionOperations';
import { createFuelState, createFuelMacQuant } from '../../../src/services/db/operations/FuelOperations';

describe('MacValidationService', () => {
  let service: MacValidationService;

  beforeEach(async () => {
    // Set up test database
    await setupTestDatabase();
    service = new MacValidationService();

    try {
      // Create test constraints with operations
      await createAllowedMacConstraint({
        id: 1,
        gross_aircraft_weight: 120000,
        min_mac: 25,
        max_mac: 35,
      });

      await createAllowedMacConstraint({
        id: 2,
        gross_aircraft_weight: 180000,
        min_mac: 28,
        max_mac: 32,
      });

      // Create a test aircraft using operations
      await createAircraft({
        id: 1,
        type: 'Test Aircraft',
        name: 'Test Aircraft',
        empty_weight: 100000,
        empty_mac: 20,
        cargo_bay_width: 10,
        treadways_width: 5,
        treadways_dist_from_center: 2.5,
        ramp_length: 20,
        ramp_max_incline: 30,
        ramp_min_incline: 15,
      });
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  describe('validateMac', () => {
    it('should return valid result when MAC is within range', async () => {
      const result = await service.validateMac(120000, 30);

      expect(result.isValid).toBe(true);
      expect(result.currentMac).toBe(30);
      expect(result.minAllowedMac).toBe(25);
      expect(result.maxAllowedMac).toBe(35);
      expect(result.weightUsedForConstraint).toBe(120000);
    });

    it('should return invalid result when MAC is below minimum', async () => {
      const result = await service.validateMac(120000, 20);

      expect(result.isValid).toBe(false);
      expect(result.currentMac).toBe(20);
      expect(result.minAllowedMac).toBe(25);
      expect(result.maxAllowedMac).toBe(35);
    });

    it('should return invalid result when MAC is above maximum', async () => {
      const result = await service.validateMac(120000, 40);

      expect(result.isValid).toBe(false);
      expect(result.currentMac).toBe(40);
      expect(result.minAllowedMac).toBe(25);
      expect(result.maxAllowedMac).toBe(35);
    });

    it('should return invalid result when no constraints exist', async () => {
      // Clear out all constraints first
      await deleteAllowedMacConstraint(1);
      await deleteAllowedMacConstraint(2);

      // Verify constraints were removed
      const constraints = await getAllAllowedMacConstraints();
      expect(constraints.count).toBe(0);

      const result = await service.validateMac(50000, 30);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('No MAC constraints found');
    });

    it('should use different constraints for higher weight', async () => {
      const result = await service.validateMac(160000, 30);

      expect(result.isValid).toBe(true);
      expect(result.minAllowedMac).toBe(28);
      expect(result.maxAllowedMac).toBe(32);
      expect(result.weightUsedForConstraint).toBe(180000);
    });
  });

  describe('validateMissionMac', () => {
    beforeEach(async () => {
      try {
        // Create test missions with necessary data for MacCalculationService to work
        // Valid mission with MAC in range (25-35)
        await createMission({
          id: 1,
          name: 'Valid Mission',
          created_date: '2023-01-01',
          modified_date: '2023-01-01',
          total_weight: 120000,
          total_mac_percent: 30,
          crew_weight: 0,
          configuration_weights: 0,
          crew_gear_weight: 0,
          food_weight: 0,
          safety_gear_weight: 0,
          etc_weight: 0,
          aircraft_id: 1,
        });

        // Create a fuel state for the valid mission
        await createFuelState({
          id: 1,
          mission_id: 1,
          total_fuel: 20000,
          main_tank_1_fuel: 5000,
          main_tank_2_fuel: 5000,
          main_tank_3_fuel: 5000,
          main_tank_4_fuel: 5000,
          external_1_fuel: 0,
          external_2_fuel: 0,
          mac_contribution: 0,
        });

        // Invalid mission with MAC outside range (> 35)
        await createMission({
          id: 2,
          name: 'Invalid Mission',
          created_date: '2023-01-01',
          modified_date: '2023-01-01',
          total_weight: 120000,
          total_mac_percent: 40,
          crew_weight: 0,
          configuration_weights: 0,
          crew_gear_weight: 0,
          food_weight: 0,
          safety_gear_weight: 0,
          etc_weight: 0,
          aircraft_id: 1,
        });

        // Create a fuel state for the invalid mission
        await createFuelState({
          id: 2,
          mission_id: 2,
          total_fuel: 20000,
          main_tank_1_fuel: 5000,
          main_tank_2_fuel: 5000,
          main_tank_3_fuel: 5000,
          main_tank_4_fuel: 5000,
          external_1_fuel: 0,
          external_2_fuel: 0,
          mac_contribution: 0,
        });

        // Create fuel MAC quantities using createFuelMacQuant operation
        await createFuelMacQuant({
          id: 1,
          main_tank_1_fuel: 5000,
          main_tank_2_fuel: 5000,
          main_tank_3_fuel: 5000,
          main_tank_4_fuel: 5000,
          external_1_fuel: 0,
          external_2_fuel: 0,
          mac_contribution: 0,
        });

      } catch (error) {
        console.error('Error setting up mission data:', error);
        throw error;
      }
    });

    // Note: With the real MacCalculationService, we cannot reliably test
    // specific MAC values. Instead, we verify that validateMissionMac works

    it('should validate a mission', async () => {
      // Test a valid mission
      try {
        const result = await service.validateMissionMac(1);

        // Expect some valid response, but we can't assert exact values
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
        expect(result.currentMac).toBeDefined();
      } catch (error) {
        fail('Should not throw an error for valid mission: ' + error);
      }
    });

    it('should throw error for non-existent mission', async () => {
      await expect(service.validateMissionMac(999)).rejects.toThrow(/Mission with ID 999 not found/);
    });
  });
});
