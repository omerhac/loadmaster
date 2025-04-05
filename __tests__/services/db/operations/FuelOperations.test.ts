import {
  Aircraft,
  Mission,
  FuelState,
  FuelMacQuant,
  createAircraft,
  createMission,
  createFuelState,
  getFuelStateByMissionId,
  updateFuelState,
  createFuelMacQuant,
  getAllFuelMacQuants,
  findClosestFuelMacConfiguration,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';
import { DatabaseFactory } from '../../../../src/services/db/DatabaseService';

describe('Fuel Operations', () => {
  let missionId: number;

  beforeEach(async () => {
    await setupTestDatabase();

    // Create an aircraft
    const aircraft: Aircraft = {
      type: 'Test',
      name: 'Aircraft',
      empty_weight: 10000,
      empty_mac: 15,
      cargo_bay_width: 5,
      treadways_width: 1,
      treadways_dist_from_center: 0.5,
      ramp_length: 2,
      ramp_max_incline: 10,
      ramp_min_incline: 3,
    };

    const aircraftResult = await createAircraft(aircraft);
    const aircraftId = aircraftResult.results[0].lastInsertId as number;

    // Create a mission
    const mission: Mission = {
      name: 'Fuel Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      crew_weight: 800,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      aircraft_id: aircraftId,
    };

    const missionResult = await createMission(mission);
    missionId = missionResult.results[0].lastInsertId as number;
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  describe('FuelState Operations', () => {
    it('should create and retrieve a fuel state', async () => {
      // Create test fuel state
      const fuelState: FuelState = {
        mission_id: missionId,
        total_fuel: 10000,
        main_tank_1_fuel: 3000,
        main_tank_2_fuel: 3000,
        main_tank_3_fuel: 2000,
        main_tank_4_fuel: 2000,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 8.5,
      };

      const createResult = await createFuelState(fuelState);
      expect(createResult.results[0].lastInsertId).toBeTruthy();

      // Get fuel state by mission ID
      const getResult = await getFuelStateByMissionId(missionId);
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.total_fuel).toBe(10000);
      expect(getResult.results[0].data?.mac_contribution).toBe(8.5);
    });

    it('should update fuel state', async () => {
      // Create test fuel state
      const fuelState: FuelState = {
        mission_id: missionId,
        total_fuel: 10000,
        main_tank_1_fuel: 3000,
        main_tank_2_fuel: 3000,
        main_tank_3_fuel: 2000,
        main_tank_4_fuel: 2000,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 8.5,
      };

      const createResult = await createFuelState(fuelState);
      const fuelStateId = createResult.results[0].lastInsertId as number;

      // Update fuel state
      const updatedFuelState: FuelState = {
        id: fuelStateId,
        mission_id: missionId,
        total_fuel: 12000,
        main_tank_1_fuel: 3500,
        main_tank_2_fuel: 3500,
        main_tank_3_fuel: 2500,
        main_tank_4_fuel: 2500,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 9.2,
      };

      await updateFuelState(updatedFuelState);

      // Verify update
      const getResult = await getFuelStateByMissionId(missionId);
      expect(getResult.results[0].data?.total_fuel).toBe(12000);
      expect(getResult.results[0].data?.main_tank_1_fuel).toBe(3500);
      expect(getResult.results[0].data?.mac_contribution).toBe(9.2);
    });
  });

  describe('FuelMacQuant Operations', () => {
    it('should create and retrieve fuel MAC quantities', async () => {
      // Create fuel MAC quantity
      const fuelMacQuant: FuelMacQuant = {
        main_tank_1_fuel: 1000,
        main_tank_2_fuel: 1000,
        main_tank_3_fuel: 1000,
        main_tank_4_fuel: 1000,
        external_1_fuel: 500,
        external_2_fuel: 500,
        mac_contribution: 7.2,
      };

      await createFuelMacQuant(fuelMacQuant);

      // Get all fuel MAC quantities
      const getResult = await getAllFuelMacQuants();
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.mac_contribution).toBe(7.2);
      expect(getResult.results[0].data?.main_tank_1_fuel).toBe(1000);
    });
    
    it('should find the closest fuel MAC configuration', async () => {
      // Create several fuel MAC quantity configurations
      const fuelConfigs = [
        {
          main_tank_1_fuel: 1000,
          main_tank_2_fuel: 1000,
          main_tank_3_fuel: 1000,
          main_tank_4_fuel: 1000,
          external_1_fuel: 0,
          external_2_fuel: 0,
          mac_contribution: 5.0,
        },
        {
          main_tank_1_fuel: 2000,
          main_tank_2_fuel: 2000,
          main_tank_3_fuel: 2000,
          main_tank_4_fuel: 2000,
          external_1_fuel: 0,
          external_2_fuel: 0,
          mac_contribution: 6.5,
        },
        {
          main_tank_1_fuel: 3000,
          main_tank_2_fuel: 3000,
          main_tank_3_fuel: 3000,
          main_tank_4_fuel: 3000,
          external_1_fuel: 0,
          external_2_fuel: 0,
          mac_contribution: 8.0,
        }
      ];
      
      // Insert all configurations
      for (const config of fuelConfigs) {
        await createFuelMacQuant(config);
      }
      
      // Test exact match
      const exactMatch = await findClosestFuelMacConfiguration(2000, 2000, 2000, 2000, 0, 0);
      expect(exactMatch.mac_contribution).toBe(6.5);
      
      // Note: The implementation searches for the exact value match in the database
      // and doesn't interpolate between values. Each tank's value must match exactly.
      
      // Create additional configurations for better test coverage
      const additionalConfigs = [
        // Configuration for testing upper bounds
        { 
          main_tank_1_fuel: 1500, 
          main_tank_2_fuel: 1500, 
          main_tank_3_fuel: 1500, 
          main_tank_4_fuel: 1500, 
          external_1_fuel: 0, 
          external_2_fuel: 0, 
          mac_contribution: 5.8 
        },
        // Configuration for testing mixed values
        { 
          main_tank_1_fuel: 1500, 
          main_tank_2_fuel: 2500, 
          main_tank_3_fuel: 1500, 
          main_tank_4_fuel: 2500, 
          external_1_fuel: 0, 
          external_2_fuel: 0, 
          mac_contribution: 6.2 
        }
      ];
      
      for (const config of additionalConfigs) {
        await createFuelMacQuant(config);
      }
      
      // Test with exact match for the new configurations
      const upperMatch = await findClosestFuelMacConfiguration(1500, 1500, 1500, 1500, 0, 0);
      expect(upperMatch.mac_contribution).toBe(5.8);
      
      const mixedMatch = await findClosestFuelMacConfiguration(1500, 2500, 1500, 2500, 0, 0);
      expect(mixedMatch.mac_contribution).toBe(6.2);
      
      // Test with values higher than any configuration
      // For this case we need to use the findClosestUpperValue logic
      const exceededMatch = await findClosestFuelMacConfiguration(4000, 4000, 4000, 4000, 0, 0);
      expect(exceededMatch.mac_contribution).toBe(8.0);
    });
  });

  // Test the findClosestUpperValue helper function indirectly through a test helper
  describe('Helper Functions', () => {
    it('should handle edge cases in finding closest matching fuel configurations', async () => {
      // Create a single fuel configuration
      const singleConfig: FuelMacQuant = {
        main_tank_1_fuel: 2000,
        main_tank_2_fuel: 2000,
        main_tank_3_fuel: 2000,
        main_tank_4_fuel: 2000,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 6.5,
      };
      
      await createFuelMacQuant(singleConfig);
      
      // Test with empty tanks (zero values)
      const zeroMatch = await findClosestFuelMacConfiguration(0, 0, 0, 0, 0, 0);
      // Should match the only available configuration
      expect(zeroMatch.mac_contribution).toBe(6.5);
      
      // Test with one tank having a very small value
      const smallValueMatch = await findClosestFuelMacConfiguration(1, 2000, 2000, 2000, 0, 0);
      expect(smallValueMatch.mac_contribution).toBe(6.5);
    });
    
    it('should throw an error when no matching fuel configuration exists', async () => {
      // Clear all existing fuel MAC configurations
      const db = await DatabaseFactory.getDatabase();
      await db.executeQuery('DELETE FROM fuel_mac_quants');
      
      // Test with values that won't match any configuration (since we deleted all entries)
      await expect(
        findClosestFuelMacConfiguration(1000, 1000, 1000, 1000, 0, 0)
      ).rejects.toThrow('No matching fuel configuration found');
    });
  });
});
