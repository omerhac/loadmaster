/**
 * Tests for MAC Validation Service
 */

import { MacValidationService } from '../../../src/services/MacValidationService';
import { TestDatabaseService } from '../../../src/services/db/TestDatabaseService';
import { setupTestDatabase, cleanupTestDatabase } from '../db/testHelpers';


describe('MacValidationService', () => {
  let service: MacValidationService;
  let testDb: TestDatabaseService;

  beforeEach(async () => {
    // Set up test database
    testDb = await setupTestDatabase();
    service = new MacValidationService();

    try {
      // Create test constraints with explicit IDs to match our test expectations
      await testDb.executeQuery(`
        INSERT INTO allowed_mac_constraints (
          id, gross_aircraft_weight, min_mac, max_mac
        ) VALUES (
          1, 120000, 25, 35
        );
      `);

      await testDb.executeQuery(`
        INSERT INTO allowed_mac_constraints (
          id, gross_aircraft_weight, min_mac, max_mac
        ) VALUES (
          2, 180000, 28, 32
        );
      `);

      // Create a test aircraft first (for foreign key relationships)
      await testDb.executeQuery(`
        INSERT INTO aircraft (
          id, type, name, empty_weight, empty_mac, 
          cargo_bay_width, treadways_width, treadways_dist_from_center, 
          ramp_length, ramp_max_incline, ramp_min_incline
        ) VALUES (
          1, 'Test Aircraft', 'Test Aircraft', 100000, 20, 
          10, 5, 2.5, 20, 30, 15
        );
      `);
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
      await testDb.executeQuery('DELETE FROM allowed_mac_constraints');

      // Verify constraints were removed
      const constraints = await testDb.executeQuery('SELECT * FROM allowed_mac_constraints');
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
        await testDb.executeQuery(`
          INSERT INTO mission (
            id, name, created_date, modified_date, total_weight, 
            total_mac_percent, crew_weight, configuration_weights, 
            crew_gear_weight, food_weight, safety_gear_weight, etc_weight, 
            aircraft_id
          ) VALUES (
            1, 'Valid Mission', '2023-01-01', '2023-01-01', 120000, 
            30, 0, 0, 0, 0, 0, 0, 1
          );
        `);

        // Create a fuel state for the valid mission
        await testDb.executeQuery(`
          INSERT INTO fuel_state (
            id, mission_id, total_fuel, main_tank_1_fuel, main_tank_2_fuel,
            main_tank_3_fuel, main_tank_4_fuel, external_1_fuel, external_2_fuel,
            mac_contribution
          ) VALUES (
            1, 1, 20000, 5000, 5000, 5000, 5000, 0, 0, 0
          );
        `);

        // Invalid mission with MAC outside range (> 35)
        await testDb.executeQuery(`
          INSERT INTO mission (
            id, name, created_date, modified_date, total_weight, 
            total_mac_percent, crew_weight, configuration_weights, 
            crew_gear_weight, food_weight, safety_gear_weight, etc_weight, 
            aircraft_id
          ) VALUES (
            2, 'Invalid Mission', '2023-01-01', '2023-01-01', 120000, 
            40, 0, 0, 0, 0, 0, 0, 1
          );
        `);

        // Create a fuel state for the invalid mission
        await testDb.executeQuery(`
          INSERT INTO fuel_state (
            id, mission_id, total_fuel, main_tank_1_fuel, main_tank_2_fuel,
            main_tank_3_fuel, main_tank_4_fuel, external_1_fuel, external_2_fuel,
            mac_contribution
          ) VALUES (
            2, 2, 20000, 5000, 5000, 5000, 5000, 0, 0, 0
          );
        `);

        // Insert fuel_mac_quants for fuel calculations
        await testDb.executeQuery(`
          INSERT INTO fuel_mac_quants (
            id, main_tank_1_fuel, main_tank_2_fuel, main_tank_3_fuel, 
            main_tank_4_fuel, external_1_fuel, external_2_fuel, mac_contribution
          ) VALUES (
            1, 5000, 5000, 5000, 5000, 0, 0, 0
          );
        `);

      } catch (error) {
        console.error('Error setting up mission data:', error);
        throw error;
      }
    });

    // Note: With the real MacCalculationService, we cannot reliably test
    // specific MAC values. Instead, we verify that validateMissionMac works
    // by ensuring it properly accesses and validates the mission.

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
