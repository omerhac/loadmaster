import {
  validateMissionLoadConstraints,
  validateCumulativeLoad,
  validateConcentratedLoad,
  ValidationStatus,
  LoadConstraintType,
} from '@/services/floor/FloorLoadValidationService';

import {
  createAircraft,
  createMission,
  createCompartment,
  createLoadConstraint,
  createCargoType,
  createCargoItem,
  Aircraft,
  Mission,
  Compartment,
  LoadConstraint,
  CargoType,
  CargoItem,
} from '@/services/db/operations';

import { TestDatabaseService } from '@/services/db/TestDatabaseService';
import { DatabaseFactory } from '@/services/db/DatabaseService';
import { initializeLoadmasterDatabase } from '@/services/db/SchemaService';

// Test setup
describe('FloorLoadValidationService', () => {
  // Test database and IDs 
  let testDb: TestDatabaseService;
  let aircraftId: number;
  let missionId: number;
  let compartment1Id: number;
  let compartment2Id: number;
  let cargoTypeId: number;
  let bulkCargoItemId: number;
  let heavyCargoItemId: number;
  let lightCargoItemId: number;

  beforeAll(async () => {
    // Initialize test database
    testDb = await TestDatabaseService.initializeInMemory();
    await initializeLoadmasterDatabase(testDb);

    // Make sure the database factory returns our test database
    jest.spyOn(DatabaseFactory, 'getDatabase').mockResolvedValue(testDb);
  });

  afterAll(() => {
    TestDatabaseService.resetInstance();
    DatabaseFactory.resetInstance();
  });

  beforeEach(async () => {
    // Clear database before each test
    testDb.loadTestData('DELETE FROM cargo_item');
    testDb.loadTestData('DELETE FROM cargo_type');
    testDb.loadTestData('DELETE FROM load_constraints');
    testDb.loadTestData('DELETE FROM compartment');
    testDb.loadTestData('DELETE FROM mission');
    testDb.loadTestData('DELETE FROM aircraft');

    // Create test aircraft
    const aircraft: Aircraft = {
      type: 'C-17',
      name: 'Test Aircraft',
      empty_weight: 282500,
      empty_mac: 25.5,
      cargo_bay_width: 216,
      treadways_width: 20,
      treadways_dist_from_center: 55,
      ramp_length: 256,
      ramp_max_incline: 9,
      ramp_min_incline: 5
    };

    const aircraftResult = await createAircraft(aircraft);
    aircraftId = aircraftResult.results[0].lastInsertId as number;

    // Create test mission
    const mission: Mission = {
      name: 'Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 350000,
      total_mac_percent: 28.0,
      crew_weight: 1200,
      configuration_weights: 500,
      crew_gear_weight: 400,
      food_weight: 300,
      safety_gear_weight: 200,
      etc_weight: 100,
      aircraft_id: aircraftId
    };

    const missionResult = await createMission(mission);
    missionId = missionResult.results[0].lastInsertId as number;

    // Create test compartments
    const compartment1: Compartment = {
      aircraft_id: aircraftId,
      name: 'Compartment 1',
      x_start: 0,
      x_end: 500,
      floor_area: 10000,
      usable_volume: 50000
    };

    const compartment2: Compartment = {
      aircraft_id: aircraftId,
      name: 'Compartment 2',
      x_start: 500,
      x_end: 1000,
      floor_area: 10000,
      usable_volume: 50000
    };

    const compartment1Result = await createCompartment(compartment1);
    compartment1Id = compartment1Result.results[0].lastInsertId as number;

    const compartment2Result = await createCompartment(compartment2);
    compartment2Id = compartment2Result.results[0].lastInsertId as number;

    // Create load constraints
    const loadConstraint1: LoadConstraint = {
      compartment_id: compartment1Id,
      max_cumulative_weight: 15000,
      max_concentrated_load: 50,
      max_running_load_treadway: 2000,
      max_running_load_between_treadways: 1500
    };

    const loadConstraint2: LoadConstraint = {
      compartment_id: compartment2Id,
      max_cumulative_weight: 20000,
      max_concentrated_load: 60,
      max_running_load_treadway: 2500,
      max_running_load_between_treadways: 2000
    };

    await createLoadConstraint(loadConstraint1);
    await createLoadConstraint(loadConstraint2);

    // Create cargo types
    const bulkCargoType: CargoType = {
      name: 'Bulk Cargo',
      default_weight: 5000,
      default_length: 200,
      default_width: 100,
      default_height: 50,
      default_forward_overhang: 0,
      default_back_overhang: 0,
      type: 'bulk'
    };

    const wheeledCargoType: CargoType = {
      name: '2-Wheeled Cargo',
      default_weight: 3000,
      default_length: 150,
      default_width: 60,
      default_height: 40,
      default_forward_overhang: 20,
      default_back_overhang: 15,
      type: '2_wheeled'
    };

    const bulkCargoTypeResult = await createCargoType(bulkCargoType);
    cargoTypeId = bulkCargoTypeResult.results[0].lastInsertId as number;

    await createCargoType(wheeledCargoType);

    // Initially, don't create cargo items - we'll create them specifically for each test
  });

  describe('validateCumulativeLoad', () => {
    it('should return empty array when no cargo items exist', async () => {
      const results = await validateCumulativeLoad(missionId);

      // Since there are no cargo items, all compartments should pass with zero load
      expect(results.length).toBe(2);
      expect(results[0].status).toBe(ValidationStatus.Pass);
      expect(results[1].status).toBe(ValidationStatus.Pass);

      expect(results[0].currentLoad).toBe(0);
      expect(results[1].currentLoad).toBe(0);
    });

    it('should pass validation when load is within limits', async () => {
      // Create a cargo item with weight below the compartment1 limit
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Light Cargo',
        weight: 10000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      await createCargoItem(cargoItem);

      const results = await validateCumulativeLoad(missionId);

      // Check compartment 1 result (should pass)
      const comp1Result = results.find(r => r.compartmentId === compartment1Id);
      expect(comp1Result).toBeDefined();
      expect(comp1Result!.status).toBe(ValidationStatus.Pass);
      expect(comp1Result!.currentLoad).toBe(10000);
      expect(comp1Result!.maxAllowedLoad).toBe(15000);
      expect(comp1Result!.overageAmount).toBe(0);

      // Check compartment 2 result (should pass with zero load)
      const comp2Result = results.find(r => r.compartmentId === compartment2Id);
      expect(comp2Result).toBeDefined();
      expect(comp2Result!.status).toBe(ValidationStatus.Pass);
      expect(comp2Result!.currentLoad).toBe(0);
    });

    it('should fail validation when load exceeds limits', async () => {
      // Create a cargo item with weight exceeding the compartment1 limit
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Heavy Cargo',
        weight: 18000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      await createCargoItem(cargoItem);

      const results = await validateCumulativeLoad(missionId);

      // Check compartment 1 result (should fail)
      const comp1Result = results.find(r => r.compartmentId === compartment1Id);
      expect(comp1Result).toBeDefined();
      expect(comp1Result!.status).toBe(ValidationStatus.Fail);
      expect(comp1Result!.currentLoad).toBe(18000);
      expect(comp1Result!.maxAllowedLoad).toBe(15000);
      expect(comp1Result!.overageAmount).toBe(3000);
      expect(comp1Result!.message).toContain('exceeds maximum allowed');
    });

    it('should correctly calculate cumulative load for multiple cargo items', async () => {
      // Create two cargo items in the same compartment
      const cargoItem1: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Cargo 1',
        weight: 8000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      const cargoItem2: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Cargo 2',
        weight: 6000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 200,
        y_start_position: 0
      };

      await createCargoItem(cargoItem1);
      await createCargoItem(cargoItem2);

      const results = await validateCumulativeLoad(missionId);

      // Check compartment 1 result (should pass but close to limit)
      const comp1Result = results.find(r => r.compartmentId === compartment1Id);
      expect(comp1Result).toBeDefined();
      expect(comp1Result!.status).toBe(ValidationStatus.Pass);
      expect(comp1Result!.currentLoad).toBe(14000); // 8000 + 6000
      expect(comp1Result!.maxAllowedLoad).toBe(15000);
    });

    it('should handle cargo items that span multiple compartments', async () => {
      // Create a cargo item that spans both compartments (placed at the boundary)
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Spanning Cargo',
        weight: 10000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 400, // Spans from 400 to 600, crossing the compartment boundary at 500
        y_start_position: 0
      };

      await createCargoItem(cargoItem);

      const results = await validateCumulativeLoad(missionId);

      // Check compartment 1 result (should have partial load)
      const comp1Result = results.find(r => r.compartmentId === compartment1Id);
      expect(comp1Result).toBeDefined();

      // Check compartment 2 result (should have partial load)
      const comp2Result = results.find(r => r.compartmentId === compartment2Id);
      expect(comp2Result).toBeDefined();

      // Verify load distribution (should be proportional to how much of the cargo is in each compartment)
      // In this case, the cargo spans from 400 to 600, so it's 50% in each compartment (roughly 5000 lbs each)
      // Note: The actual calculation might vary slightly due to position calculations
      expect(comp1Result!.currentLoad).toBeCloseTo(5000, 0);
      expect(comp2Result!.currentLoad).toBeCloseTo(5000, 0);
    });
  });

  describe('validateConcentratedLoad', () => {
    it('should return empty array when no cargo items exist', async () => {
      const results = await validateConcentratedLoad(missionId);
      expect(results.length).toBe(0);
    });

    it('should pass validation when concentrated load is within limits', async () => {
      // Create a bulk cargo item with concentrated load below the limit
      // For a bulk item with weight 2000 lbs and area 10000 sq.in, concentrated load is 0.2 lbs/sq.in
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Light Concentrated Cargo',
        weight: 2000,
        length: 100,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      const result = await createCargoItem(cargoItem);
      bulkCargoItemId = result.results[0].lastInsertId as number;

      const results = await validateConcentratedLoad(missionId);

      // Should have one result for the compartment the cargo is in
      expect(results.length).toBe(1);
      expect(results[0].status).toBe(ValidationStatus.Pass);
      expect(results[0].constraintType).toBe(LoadConstraintType.Concentrated);
      expect(results[0].cargoItemId).toBe(bulkCargoItemId);
      expect(results[0].currentLoad).toBeCloseTo(0.2, 1); // 2000 / (100 * 100) = 0.2 lbs/sq.in
      expect(results[0].maxAllowedLoad).toBe(50);
    });

    it('should fail validation when concentrated load exceeds limits', async () => {
      // Create a bulk cargo item with concentrated load above the limit
      // For a heavy bulk item with small footprint, concentrated load will be high
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Heavy Concentrated Cargo',
        weight: 10000,
        length: 10,
        width: 10,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      const result = await createCargoItem(cargoItem);
      bulkCargoItemId = result.results[0].lastInsertId as number;

      const results = await validateConcentratedLoad(missionId);

      // Should have one result that fails
      expect(results.length).toBe(1);
      expect(results[0].status).toBe(ValidationStatus.Fail);
      expect(results[0].constraintType).toBe(LoadConstraintType.Concentrated);
      expect(results[0].cargoItemId).toBe(bulkCargoItemId);
      expect(results[0].currentLoad).toBeCloseTo(100, 0); // 10000 / (10 * 10) = 100 lbs/sq.in
      expect(results[0].maxAllowedLoad).toBe(50);
      expect(results[0].overageAmount).toBeCloseTo(50, 0);
      expect(results[0].message).toContain('exceeds maximum allowed');
    });

    it('should validate 2-wheeled cargo items correctly', async () => {
      // First, create a 2-wheeled cargo type
      const wheeledCargoType: CargoType = {
        name: '2-Wheeled Cargo',
        default_weight: 3000,
        default_length: 150,
        default_width: 60,
        default_height: 40,
        default_forward_overhang: 20,
        default_back_overhang: 15,
        type: '2_wheeled'
      };

      const wheeledCargoTypeResult = await createCargoType(wheeledCargoType);
      const wheeledCargoTypeId = wheeledCargoTypeResult.results[0].lastInsertId as number;

      // Create a heavy 2-wheeled cargo item
      const heavyCargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: wheeledCargoTypeId,
        name: 'Heavy 2-Wheeled Vehicle',
        weight: 6000,
        length: 150,
        width: 60,
        height: 40,
        forward_overhang: 20,
        back_overhang: 15,
        x_start_position: 100,
        y_start_position: 0
      };

      // Create a 2-wheeled cargo item
      const lightCargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: wheeledCargoTypeId,
        name: 'Light 2-Wheeled Vehicle',
        weight: 3000,
        length: 150,
        width: 60,
        height: 40,
        forward_overhang: 20,
        back_overhang: 15,
        x_start_position: 100,
        y_start_position: 0
      };

      const heavyResult = await createCargoItem(heavyCargoItem);
      heavyCargoItemId = heavyResult.results[0].lastInsertId as number;

      const lightResult = await createCargoItem(lightCargoItem);
      lightCargoItemId = lightResult.results[0].lastInsertId as number;

      const results = await validateConcentratedLoad(missionId);

      // The concentrated load for a 2-wheeled item is calculated differently
      // We should have 4 results, 2 per cargo item (one for each wheel)
      expect(results.length).toBe(4);

      for (const result of results) {
        if (result.cargoItemId === heavyCargoItemId) {
          // The load should be calculated based on wheel contact area
          // For a 2-wheeled item with weight 6000 lbs, divided by 2 wheels with 10x3 contact area
          // Concentrated load is approximately 100 lbs/sq.in (6000 / (2 * 10 * 3))
          // Should fail with the calculated load
          expect(result.status).toBe(ValidationStatus.Fail);
          expect(result.constraintType).toBe(LoadConstraintType.Concentrated);
          expect(result.cargoItemId).toBe(heavyCargoItemId);
          expect(result.currentLoad).toBe(100); // Should be above the threshold of 50
          expect(result.maxAllowedLoad).toBe(50);
          expect(result.overageAmount).toBe(50);
          expect(result.message).toContain('exceeds maximum allowed');
        } else if (result.cargoItemId === lightCargoItemId) {
          // The load should be calculated based on wheel contact area
          // For a 2-wheeled item with weight 3000 lbs, divided by 2 wheels with 10x3 contact area
          // Concentrated load is approximately 50 lbs/sq.in (3000 / (2 * 10 * 3))
          // Should pass with the calculated load
          expect(result.status).toBe(ValidationStatus.Pass);
          expect(result.constraintType).toBe(LoadConstraintType.Concentrated);
          expect(result.cargoItemId).toBe(lightCargoItemId);
          expect(result.currentLoad).toBeCloseTo(50, 1);
          expect(result.maxAllowedLoad).toBe(50);
          expect(result.overageAmount).toBeCloseTo(0, 1);
        }
      }
    });
  });

  describe('validateMissionLoadConstraints', () => {
    it('should aggregate results from all validation types', async () => {
      // Create a cargo item that will pass both validations
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Standard Cargo',
        weight: 5000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      await createCargoItem(cargoItem);

      const missionResults = await validateMissionLoadConstraints(missionId);

      // Should contain both types of validation results
      expect(missionResults.missionId).toBe(missionId);
      expect(missionResults.status).toBe(ValidationStatus.Pass);

      // Should have cumulative results for both compartments (2) and one concentrated result
      expect(missionResults.results.length).toBe(3);

      // Count by constraint type
      const cumulativeResults = missionResults.results.filter(r =>
        r.constraintType === LoadConstraintType.Cumulative
      );

      const concentratedResults = missionResults.results.filter(r =>
        r.constraintType === LoadConstraintType.Concentrated
      );

      expect(cumulativeResults.length).toBe(2); // One for each compartment
      expect(concentratedResults.length).toBe(1); // One for the cargo item
    });

    it('should fail overall if any validation fails', async () => {
      // Create a cargo item that will fail concentrated load but pass cumulative
      const cargoItem: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Heavy Concentrated Cargo',
        weight: 10000,
        length: 10,
        width: 10,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };

      await createCargoItem(cargoItem);

      const missionResults = await validateMissionLoadConstraints(missionId);

      // Overall status should be FAIL
      expect(missionResults.status).toBe(ValidationStatus.Fail);

      // Should have at least one failed result
      const failedResults = missionResults.results.filter(r =>
        r.status === ValidationStatus.Fail
      );

      expect(failedResults.length).toBeGreaterThan(0);

      // Check that failure is due to concentrated load
      const concentratedFailures = failedResults.filter(r =>
        r.constraintType === LoadConstraintType.Concentrated
      );

      expect(concentratedFailures.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent mission', async () => {
      await expect(validateMissionLoadConstraints(9999)).rejects.toThrow('Mission with ID 9999 not found');
    });

    it('should handle empty mission with no cargo items', async () => {
      const missionResults = await validateMissionLoadConstraints(missionId);
      
      // Should pass overall with no cargo items
      expect(missionResults.missionId).toBe(missionId);
      expect(missionResults.status).toBe(ValidationStatus.Pass);
      
      // Should have only cumulative results for compartments (no concentrated load results)
      const cumulativeResults = missionResults.results.filter(r =>
        r.constraintType === LoadConstraintType.Cumulative
      );
      
      const concentratedResults = missionResults.results.filter(r =>
        r.constraintType === LoadConstraintType.Concentrated
      );
      
      expect(cumulativeResults.length).toBe(2); // One for each compartment
      expect(concentratedResults.length).toBe(0); // No cargo items, so no concentrated results
      
      // All cumulative results should show zero load
      for (const result of cumulativeResults) {
        expect(result.currentLoad).toBe(0);
        expect(result.status).toBe(ValidationStatus.Pass);
      }
    });

    it('should handle multiple passing cargo items correctly', async () => {
      // Create multiple cargo items that will all pass validation
      const cargoItems = [
        {
          mission_id: missionId,
          cargo_type_id: cargoTypeId,
          name: 'Cargo 1',
          weight: 3000,
          length: 150,
          width: 100,
          height: 50,
          x_start_position: 100,
          y_start_position: 0
        },
        {
          mission_id: missionId,
          cargo_type_id: cargoTypeId,
          name: 'Cargo 2',
          weight: 4000,
          length: 160,
          width: 90,
          height: 45,
          x_start_position: 300,
          y_start_position: 20
        },
        {
          mission_id: missionId,
          cargo_type_id: cargoTypeId,
          name: 'Cargo 3',
          weight: 5000,
          length: 180,
          width: 120,
          height: 55,
          x_start_position: 600, // in compartment 2
          y_start_position: 10
        }
      ];
      
      for (const item of cargoItems) {
        await createCargoItem(item);
      }
      
      const missionResults = await validateMissionLoadConstraints(missionId);
      
      // Should pass overall
      expect(missionResults.status).toBe(ValidationStatus.Pass);
      
      // Should have results for all cargo items plus compartments
      const expectedResultCount = cargoItems.length + 2; // 3 concentrated + 2 cumulative
      expect(missionResults.results.length).toBe(expectedResultCount);
      
      // All results should be passing
      for (const result of missionResults.results) {
        expect(result.status).toBe(ValidationStatus.Pass);
      }
      
      // Check cumulative load in compartment 1 (should be sum of cargo 1 and 2)
      const comp1Result = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Cumulative && 
        r.compartmentId === compartment1Id
      );
      
      expect(comp1Result).toBeDefined();
      expect(comp1Result!.currentLoad).toBe(7000); // 3000 + 4000
      
      // Check cumulative load in compartment 2 (should be cargo 3)
      const comp2Result = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Cumulative && 
        r.compartmentId === compartment2Id
      );
      
      expect(comp2Result).toBeDefined();
      expect(comp2Result!.currentLoad).toBe(5000);
    });

    it('should handle mixed passing and failing results correctly', async () => {
      // Create cargo items with mixed validation results:
      // 1. A passing bulk cargo
      // 2. A failing concentrated load cargo
      
      // Passing bulk cargo
      const passingCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Passing Cargo',
        weight: 5000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };
      
      // Failing concentrated load cargo
      const failingCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Failing Cargo',
        weight: 12000,
        length: 10,
        width: 10,
        height: 50,
        x_start_position: 600, // in compartment 2
        y_start_position: 0
      };
      
      await createCargoItem(passingCargo);
      await createCargoItem(failingCargo);
      
      const missionResults = await validateMissionLoadConstraints(missionId);
      
      // Overall status should be FAIL since one validation fails
      expect(missionResults.status).toBe(ValidationStatus.Fail);
      
      // Count passing and failing results
      const passingResults = missionResults.results.filter(r => r.status === ValidationStatus.Pass);
      const failingResults = missionResults.results.filter(r => r.status === ValidationStatus.Fail);
      
      expect(passingResults.length).toBeGreaterThan(0);
      expect(failingResults.length).toBeGreaterThan(0);
      
      // Verify that both cumulative validations pass but one concentrated fails
      const cumulativeResults = missionResults.results.filter(r => 
        r.constraintType === LoadConstraintType.Cumulative
      );
      
      for (const result of cumulativeResults) {
        expect(result.status).toBe(ValidationStatus.Pass);
      }
      
      // Find the failing concentrated load result
      const failingConcentratedResult = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Concentrated && 
        r.status === ValidationStatus.Fail
      );
      
      expect(failingConcentratedResult).toBeDefined();
      expect(failingConcentratedResult!.currentLoad).toBeGreaterThan(failingConcentratedResult!.maxAllowedLoad);
    });

    it('should handle cargo spanning across compartment boundary', async () => {
      // Create a cargo item that spans both compartments
      const spanningCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Spanning Cargo',
        weight: 10000,
        length: 300,
        width: 100,
        height: 50,
        x_start_position: 400, // spans from 400 to 700, crossing boundary at 500
        y_start_position: 0
      };
      
      await createCargoItem(spanningCargo);
      
      const missionResults = await validateMissionLoadConstraints(missionId);
      
      // Find cumulative results for both compartments
      const comp1Result = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Cumulative && 
        r.compartmentId === compartment1Id
      );
      
      const comp2Result = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Cumulative && 
        r.compartmentId === compartment2Id
      );
      
      expect(comp1Result).toBeDefined();
      expect(comp2Result).toBeDefined();
      
      // The weight should be distributed proportionally between compartments
      // 1/3 of the cargo is in compartment 1, 2/3 in compartment 2
      expect(comp1Result!.currentLoad).toBeCloseTo(10000 * (100/300), 0); // ~3333 lbs
      expect(comp2Result!.currentLoad).toBeCloseTo(10000 * (200/300), 0); // ~6667 lbs
    });

    it('should handle multiple failing validations correctly', async () => {
      // Create multiple cargo items that will fail validation
      // 1. A cargo exceeding cumulative load in compartment 1
      // 2. A cargo with concentrated load issue in compartment 2
      
      // Heavy cargo exceeding cumulative load
      const heavyCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Heavy Cumulative Cargo',
        weight: 16000, // Exceeds 15000 limit
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };
      
      // Cargo with concentrated load issue
      const concentratedCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'High Density Cargo',
        weight: 8000,
        length: 10,
        width: 10,
        height: 30,
        x_start_position: 600, // in compartment 2
        y_start_position: 0
      };
      
      await createCargoItem(heavyCargo);
      await createCargoItem(concentratedCargo);
      
      const missionResults = await validateMissionLoadConstraints(missionId);
      
      // Overall status should be FAIL
      expect(missionResults.status).toBe(ValidationStatus.Fail);
      
      // Should have multiple failing results
      const failingResults = missionResults.results.filter(r => r.status === ValidationStatus.Fail);
      expect(failingResults.length).toBeGreaterThan(1);
      
      // Check that we have failures of different constraint types
      const cumulativeFailures = failingResults.filter(r => 
        r.constraintType === LoadConstraintType.Cumulative
      );
      
      const concentratedFailures = failingResults.filter(r => 
        r.constraintType === LoadConstraintType.Concentrated
      );
      
      expect(cumulativeFailures.length).toBeGreaterThan(0);
      expect(concentratedFailures.length).toBeGreaterThan(0);
    });

    it('should validate different types of cargo correctly', async () => {
      // Create a 2-wheeled cargo type
      const wheeledCargoType: CargoType = {
        name: '2-Wheeled Cargo',
        default_weight: 3000,
        default_length: 150,
        default_width: 60,
        default_height: 40,
        default_forward_overhang: 20,
        default_back_overhang: 15,
        type: '2_wheeled'
      };
      
      const wheeledCargoTypeResult = await createCargoType(wheeledCargoType);
      const wheeledCargoTypeId = wheeledCargoTypeResult.results[0].lastInsertId as number;
      
      // Create different types of cargo in the same mission
      const bulkCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Bulk Cargo',
        weight: 5000,
        length: 200,
        width: 100,
        height: 50,
        x_start_position: 100,
        y_start_position: 0
      };
      
      const wheeledCargo: CargoItem = {
        mission_id: missionId,
        cargo_type_id: wheeledCargoTypeId,
        name: '2-Wheeled Vehicle',
        weight: 3000,
        length: 150,
        width: 60,
        height: 40,
        forward_overhang: 20,
        back_overhang: 15,
        x_start_position: 600, // in compartment 2
        y_start_position: 0
      };
      
      await createCargoItem(bulkCargo);
      await createCargoItem(wheeledCargo);
      
      const missionResults = await validateMissionLoadConstraints(missionId);
      
      // Should validate both types correctly
      const concentratedResults = missionResults.results.filter(r => 
        r.constraintType === LoadConstraintType.Concentrated
      );
      
      // Should have 1 result for bulk cargo and 2 for the wheeled cargo (one per wheel)
      expect(concentratedResults.length).toBe(3);
      
      // Check cumulative results are correct
      const comp1Result = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Cumulative && 
        r.compartmentId === compartment1Id
      );
      
      const comp2Result = missionResults.results.find(r => 
        r.constraintType === LoadConstraintType.Cumulative && 
        r.compartmentId === compartment2Id
      );
      
      expect(comp1Result!.currentLoad).toBe(5000); // Bulk cargo
      expect(comp2Result!.currentLoad).toBe(3000); // Wheeled cargo
    });
  });
}); 