import {
  calculateConcentratedLoad,
  calculateLoadPerCompartment,
  calculateRunningLoad,
  aggregateCumulativeLoadByCompartment,
  WHEEL_DIMENSIONS,
} from '../../../src/services/floor/FloorLoadCalculationService';
import { TestDatabaseService } from '../../../src/services/db/TestDatabaseService';
import { initializeLoadmasterDatabase } from '../../../src/services/db/SchemaService';
import { DatabaseFactory } from '../../../src/services/db/DatabaseService';
import {
  createAircraft,
  createMission,
  createCompartment,
  createCargoType,
  createCargoItem,
  deleteCargoItem,
} from '../../../src/services/db/operations';

describe('Floor Load Calculation Integration Tests', () => {
  let testDb: TestDatabaseService;
  let createdCargoItemIds: number[] = [];
  // Store mission and cargo type IDs for consistent references
  let missionId: number;
  let bulkTypeId: number;
  let twoWheeledTypeId: number;
  let fourWheeledTypeId: number;

  // Store specific cargo item IDs for individual tests
  let bulkCargoId: number;
  let twoWheeledCargoId: number;
  let fourWheeledCargoId: number;

  beforeAll(async () => {
    // Initialize test database
    testDb = await TestDatabaseService.initializeInMemory();
    await initializeLoadmasterDatabase(testDb);

    // Make sure the database factory returns our test database
    jest.spyOn(DatabaseFactory, 'getDatabase').mockResolvedValue(testDb);
  });

  afterAll(async () => {
    TestDatabaseService.resetInstance();
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    // Set up test data
    const ids = await setupTestData();
    missionId = ids.missionId;
    bulkTypeId = ids.bulkTypeId;
    twoWheeledTypeId = ids.twoWheeledTypeId;
    fourWheeledTypeId = ids.fourWheeledTypeId;

    // Create actual test cargo items
    const itemIds = await createTestCargoItems(missionId, bulkTypeId, twoWheeledTypeId, fourWheeledTypeId);

    // Store created cargo item IDs
    bulkCargoId = itemIds.bulkCargoId;
    twoWheeledCargoId = itemIds.twoWheeledCargoId;
    fourWheeledCargoId = itemIds.fourWheeledCargoId;
    createdCargoItemIds = [bulkCargoId, twoWheeledCargoId, fourWheeledCargoId];

    // Verify that we have valid IDs before running tests
    expect(createdCargoItemIds.length).toBe(3);
    expect(createdCargoItemIds[0]).toBeGreaterThan(0);
    expect(createdCargoItemIds[1]).toBeGreaterThan(0);
    expect(createdCargoItemIds[2]).toBeGreaterThan(0);
  });

  afterEach(async () => {
    // Clean up created items
    for (const id of createdCargoItemIds) {
      await deleteCargoItem(id);
    }
    createdCargoItemIds = [];
  });

  describe('Integration Tests', () => {
    it('should calculate load values for bulk cargo', async () => {
      // Arrange - Use the bulk cargo ID

      // Test item properties for reference:
      // weight: 1000 lbs
      // length: 20 inches
      // width: 100 inches
      // Cargo spans compartment 1 (x: 0-100)

      // Act - Calculate all three types of loads
      const concentratedLoad = await calculateConcentratedLoad(bulkCargoId);
      const loadPerCompartment = await calculateLoadPerCompartment(bulkCargoId);
      const runningLoad = await calculateRunningLoad(bulkCargoId);

      // Assert

      // CONCENTRATED LOAD CALCULATION:
      // For bulk cargo: weight / (length * width)
      // Expected: 1000 lbs / (20 in * 100 in) = 0.5 lbs/sq.in
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeCloseTo(0.5, 2);

      // LOAD PER COMPARTMENT CALCULATION:
      // Cargo is at x_position 50 with length 20, so it's fully within compartment 1 (0-100)
      // Expected: 100% of weight in compartment 1 = 1000 lbs
      expect(loadPerCompartment).toBeDefined();
      expect(loadPerCompartment.length).toBe(1); // Should be in exactly 1 compartment
      expect(loadPerCompartment[0].compartmentId).toBeGreaterThan(0);
      expect(loadPerCompartment[0].load.unit).toBe('lbs');
      expect(loadPerCompartment[0].load.value).toBeCloseTo(1000, 2); // Full cargo weight

      // RUNNING LOAD CALCULATION:
      // For bulk cargo: weight / length
      // Expected: 1000 lbs / 20 in = 50 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(50, 2);
    });

    it('should calculate load values for bulk cargo spanning multiple compartments', async () => {
      // Create a larger bulk cargo that spans multiple compartments
      const largeBulkCargoItem = {
        mission_id: missionId,
        cargo_type_id: bulkTypeId,
        name: 'Large Bulk Cargo',
        weight: 2000,
        length: 200,  // This will span from x=50 to x=250
        width: 100,
        height: 50,
        forward_overhang: 0,
        back_overhang: 0,
        x_start_position: 50,
        y_start_position: 0,
      };
      const largeBulkResult = await createCargoItem(largeBulkCargoItem);
      const largeBulkId = largeBulkResult.results?.[0]?.lastInsertId || 4;
      createdCargoItemIds.push(largeBulkId);

      // Calculate load per compartment for the cargo item spanning multiple compartments
      const loadPerCompartment = await calculateLoadPerCompartment(largeBulkId);

      // LOAD PER COMPARTMENT CALCULATION:
      // Cargo spans from x=50 to x=250 (length=200)
      // Compartment 1: x=0 to x=100
      // Compartment 2: x=100 to x=200
      // Compartment 3: x=200 to x=300
      //
      // Expected overlap:
      // - Compartment 1: from x=50 to x=100 = 50 units = 25% of cargo length
      // - Compartment 2: from x=100 to x=200 = 100 units = 50% of cargo length
      // - Compartment 3: from x=200 to x=250 = 50 units = 25% of cargo length
      //
      // Expected load distribution:
      // - Compartment 1: 2000 lbs * 25% = 500 lbs
      // - Compartment 2: 2000 lbs * 50% = 1000 lbs
      // - Compartment 3: 2000 lbs * 25% = 500 lbs

      expect(loadPerCompartment).toBeDefined();
      expect(loadPerCompartment.length).toBe(3); // Should span all 3 compartments

      // Sort by compartment ID to ensure consistent ordering
      const sortedResults = [...loadPerCompartment].sort((a, b) =>
        a.compartmentId - b.compartmentId
      );

      // Verify load per compartment
      expect(sortedResults[0].load.unit).toBe('lbs');
      expect(sortedResults[0].load.value).toBeCloseTo(500, 2); // 25% of weight

      expect(sortedResults[1].load.unit).toBe('lbs');
      expect(sortedResults[1].load.value).toBeCloseTo(1000, 2); // 50% of weight

      expect(sortedResults[2].load.unit).toBe('lbs');
      expect(sortedResults[2].load.value).toBeCloseTo(500, 2); // 25% of weight

      // Also test concentrated load and running load
      const concentratedLoad = await calculateConcentratedLoad(largeBulkId);
      const runningLoad = await calculateRunningLoad(largeBulkId);

      // CONCENTRATED LOAD CALCULATION:
      // For bulk cargo: weight / (length * width)
      // Expected: 2000 lbs / (200 in * 100 in) = 2000 / 20000 = 0.1 lbs/sq.in
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeCloseTo(0.1, 2);

      // RUNNING LOAD CALCULATION:
      // For bulk cargo: weight / length
      // Expected: 2000 lbs / 200 in = 10 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(10, 2);
    });

    it('should calculate load values for 2-wheeled cargo', async () => {
      // Arrange - Use the 2-wheeled cargo ID

      // Test item properties for reference:
      // weight: 1500 lbs
      // length: 80 inches
      // width: 60 inches
      // forward_overhang: 10 inches
      // back_overhang: 10 inches
      // x_start_position: 30
      // Wheel dimensions (from constants):
      // - WHEEL_WIDTH: 10 inches
      // - CONTACT_LENGTH: 3.0 inches
      // - COUNT: 2 wheels

      // Act - Calculate concentrated load
      const concentratedLoad = await calculateConcentratedLoad(twoWheeledCargoId);

      // Calculate load distribution
      const loadPerCompartment = await calculateLoadPerCompartment(twoWheeledCargoId);

      // Calculate running load
      const runningLoad = await calculateRunningLoad(twoWheeledCargoId);

      // Assert

      // CONCENTRATED LOAD CALCULATION:
      // For 2-wheeled: weight / (wheelCount * wheelWidth * contactLength)
      // Expected: 1500 lbs / (2 * 10 in * 3.0 in) = 1500 / 60 = 24 lbs/sq.in
      const wheelWidth = WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['2_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['2_wheeled'].COUNT;
      const expectedConcentratedLoad = 1500 / (wheelCount * wheelWidth * contactLength);

      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeCloseTo(expectedConcentratedLoad, 2);
      expect(concentratedLoad.value).toBeCloseTo(25, 2); // 1500 / (2 * 10 * 3.0) = 25

      // LOAD PER COMPARTMENT CALCULATION:
      // The wheeled cargo's effective footprint:
      // x_start with overhang: 30 + 10 = 40
      // x_end without overhang: 30 + 80 - 10 = 100
      // So it's fully within compartment 1 (0-100)
      expect(loadPerCompartment).toBeDefined();
      // If the wheel touchpoints fall within compartment 1, 100% of weight should be there
      expect(loadPerCompartment[0].compartmentId).toBeGreaterThan(0);
      expect(loadPerCompartment[0].load.unit).toBe('lbs');
      expect(loadPerCompartment[0].load.value).toBeCloseTo(1500, 2);

      // RUNNING LOAD CALCULATION:
      // For wheeled cargo: weight / (length - (forward_overhang + back_overhang))
      // Effective length: 80 - (10 + 10) = 60 inches
      // Expected: 1500 lbs / 60 in = 25 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(25, 2); // 1500 / (80 - (10 + 10)) = 25
    });

    it('should calculate load values for 4-wheeled cargo', async () => {
      // Arrange - Use the 4-wheeled cargo ID

      // Test item properties for reference:
      // weight: 2000 lbs
      // length: 120 inches
      // width: 80 inches
      // forward_overhang: 15 inches
      // back_overhang: 15 inches
      // x_start_position: 120
      // Wheel dimensions (from constants):
      // - WHEEL_WIDTH: 10 inches
      // - CONTACT_LENGTH: 2.5 inches
      // - COUNT: 4 wheels

      const concentratedLoad = await calculateConcentratedLoad(fourWheeledCargoId);

      const loadPerCompartment = await calculateLoadPerCompartment(fourWheeledCargoId);

      const runningLoad = await calculateRunningLoad(fourWheeledCargoId);


      // CONCENTRATED LOAD CALCULATION:
      // For 4-wheeled: weight / (wheelCount * wheelWidth * contactLength)
      // Expected: 2000 lbs / (4 * 10 in * 2.5 in) = 2000 / 100 = 20 lbs/sq.in
      const wheelWidth = WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['4_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['4_wheeled'].COUNT;
      const expectedConcentratedLoad = 2000 / (wheelCount * wheelWidth * contactLength);

      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeCloseTo(expectedConcentratedLoad, 2);
      expect(concentratedLoad.value).toBeCloseTo(20, 2); // 2000 / (4 * 10 * 2.5) = 20

      // LOAD PER COMPARTMENT CALCULATION:
      // The wheeled cargo's effective footprint:
      // x_start with overhang: 120 + 15 = 135
      // x_end without overhang: 120 + 120 - 15 = 225
      // This spans compartment 2 (100-200) and extends beyond it
      //
      // Wheel positions:
      // - Front wheels at x=135 are in compartment with x=100-200
      // - Back wheels at x=225 are outside this compartment
      // - Each wheel carries 1/4 of the weight (500 lbs)
      // - So the compartment should have 2 wheels = 1000 lbs
      expect(loadPerCompartment).toBeDefined();
      expect(loadPerCompartment.length).toBe(2); // Should have exactly 2 compartments with load
      expect(loadPerCompartment[0].load.unit).toBe('lbs');
      expect(loadPerCompartment[0].load.value).toBeCloseTo(1000, 2); // Exactly 2 wheels = 1000 lbs
      expect(loadPerCompartment[1].load.value).toBeCloseTo(1000, 2); // Exactly 2 wheels = 1000 lbs
      // RUNNING LOAD CALCULATION:
      // For wheeled cargo: weight / (length - (forward_overhang + back_overhang))
      // Effective length: 120 - (15 + 15) = 90 inches
      // Expected: 2000 lbs / 90 in = 22.22 lbs/in
      // For 4-wheeled items, divide by 2 to get running load per side = 11.11 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(11.11, 2); // (2000 / (120 - (15 + 15))) / 2 = 11.11
    });

    it('should aggregate cumulative loads by compartment for a mission', async () => {
      // Arrange - Use existing test data setup from beforeEach
      // We have 3 cargo items already created in our mission:
      // 1. Bulk cargo: 1000 lbs in compartment 1
      // 2. Two-wheeled cargo: 1500 lbs in compartment 1
      // 3. Four-wheeled cargo: 2000 lbs split between compartment 2 and 3 (1000 lbs each)

      // Act - Calculate aggregate loads by compartment
      const compartmentLoads = await aggregateCumulativeLoadByCompartment(missionId);

      // Assert
      // We expect the loads to be distributed as follows:
      // - Compartment 1: 1000 lbs (bulk) + 1500 lbs (2-wheeled) = 2500 lbs
      // - Compartment 2: 1000 lbs (half of 4-wheeled)
      // - Compartment 3: 1000 lbs (half of 4-wheeled)

      expect(compartmentLoads).toBeDefined();
      expect(compartmentLoads.size).toBe(3); // Should have 3 compartments with loads

      // Sort compartment IDs to ensure consistent testing
      const sortedCompartmentIds = Array.from(compartmentLoads.keys()).sort();

      // Check each compartment's load
      expect(compartmentLoads.get(sortedCompartmentIds[0])).toBeCloseTo(2500, 2); // Compartment 1
      expect(compartmentLoads.get(sortedCompartmentIds[1])).toBeCloseTo(1000, 2); // Compartment 2
      expect(compartmentLoads.get(sortedCompartmentIds[2])).toBeCloseTo(1000, 2); // Compartment 3
    });
  });

  /**
   * Sets up test data in the database - creates required tables and base data
   * @returns Object containing IDs of created reference entities
   */
  async function setupTestData(): Promise<{
    aircraftId: number;
    missionId: number;
    bulkTypeId: number;
    twoWheeledTypeId: number;
    fourWheeledTypeId: number;
  }> {
    // Create test aircraft
    const aircraft = {
      type: 'C-17',
      name: 'Test Aircraft',
      empty_weight: 100000,
      empty_mac: 30,
      cargo_bay_width: 144,
      treadways_width: 22,
      treadways_dist_from_center: 50,
      ramp_length: 300,
      ramp_max_incline: 15,
      ramp_min_incline: 5,
    };
    const aircraftResult = await createAircraft(aircraft);
    const createdAircraftId = aircraftResult.results?.[0]?.lastInsertId || 1;

    // Create test mission
    const mission = {
      name: 'Test Mission',
      created_date: '2023-01-01',
      modified_date: '2023-01-01',
      total_weight: 10000,
      total_mac_percent: 25,
      crew_weight: 800,
      configuration_weights: 0,
      crew_gear_weight: 0,
      food_weight: 0,
      safety_gear_weight: 0,
      etc_weight: 0,
      aircraft_id: createdAircraftId,
    };
    const missionResult = await createMission(mission);
    const createdMissionId = missionResult.results?.[0]?.lastInsertId || 1;

    // Create test compartments
    await createCompartment({
      aircraft_id: createdAircraftId,
      name: 'Compartment 1',
      x_start: 0,
      x_end: 100,
      floor_area: 10000,
      usable_volume: 50000,
    });

    await createCompartment({
      aircraft_id: createdAircraftId,
      name: 'Compartment 2',
      x_start: 100,
      x_end: 200,
      floor_area: 10000,
      usable_volume: 50000,
    });

    await createCompartment({
      aircraft_id: createdAircraftId,
      name: 'Compartment 3',
      x_start: 200,
      x_end: 300,
      floor_area: 10000,
      usable_volume: 50000,
    });

    // Create test cargo types
    const bulkTypeResult = await createCargoType({
      name: 'Bulk Cargo',
      default_weight: 1000,
      default_length: 20,
      default_width: 100,
      default_height: 50,
      default_forward_overhang: 0,
      default_back_overhang: 0,
      type: 'bulk',
    });
    const createdBulkTypeId = bulkTypeResult.results?.[0]?.lastInsertId || 1;

    const twoWheeledTypeResult = await createCargoType({
      name: 'Two Wheeled Vehicle',
      default_weight: 1500,
      default_length: 80,
      default_width: 60,
      default_height: 70,
      default_forward_overhang: 10,
      default_back_overhang: 10,
      type: '2_wheeled',
    });
    const createdTwoWheeledTypeId = twoWheeledTypeResult.results?.[0]?.lastInsertId || 2;

    const fourWheeledTypeResult = await createCargoType({
      name: 'Four Wheeled Vehicle',
      default_weight: 2000,
      default_length: 120,
      default_width: 80,
      default_height: 60,
      default_forward_overhang: 15,
      default_back_overhang: 15,
      type: '4_wheeled',
    });
    const createdFourWheeledTypeId = fourWheeledTypeResult.results?.[0]?.lastInsertId || 3;

    return {
      aircraftId: createdAircraftId,
      missionId: createdMissionId,
      bulkTypeId: createdBulkTypeId,
      twoWheeledTypeId: createdTwoWheeledTypeId,
      fourWheeledTypeId: createdFourWheeledTypeId,
    };
  }

  /**
   * Creates test cargo items that will be used in tests
   * @param missionId The mission ID to associate items with
   * @param bulkTypeId The bulk cargo type ID
   * @param twoWheeledTypeId The 2-wheeled cargo type ID
   * @param fourWheeledTypeId The 4-wheeled cargo type ID
   * @returns Object containing created cargo item IDs
   */
  async function createTestCargoItems(
    missionIdParam: number,
    bulkTypeIdParam: number,
    twoWheeledTypeIdParam: number,
    fourWheeledTypeIdParam: number
  ): Promise<{
    bulkCargoId: number;
    twoWheeledCargoId: number;
    fourWheeledCargoId: number;
  }> {
    // Create a bulk cargo item
    const bulkCargoItem = {
      mission_id: missionIdParam,
      cargo_type_id: bulkTypeIdParam,
      name: 'Test Bulk Cargo',
      weight: 1000,
      length: 20,
      width: 100,
      height: 50,
      forward_overhang: 0,
      back_overhang: 0,
      x_start_position: 50,
      y_start_position: 0,
    };
    const bulkCargoResult = await createCargoItem(bulkCargoItem);
    const createdBulkCargoId = bulkCargoResult.results?.[0]?.lastInsertId || 1;

    // Create a 2-wheeled cargo item
    const twoWheeledItem = {
      mission_id: missionIdParam,
      cargo_type_id: twoWheeledTypeIdParam,
      name: 'Test 2-Wheeled Vehicle',
      weight: 1500,
      length: 80,
      width: 60,
      height: 70,
      forward_overhang: 10,
      back_overhang: 10,
      x_start_position: 30,
      y_start_position: 0,
    };
    const twoWheeledResult = await createCargoItem(twoWheeledItem);
    const createdTwoWheeledCargoId = twoWheeledResult.results?.[0]?.lastInsertId || 2;

    // Create a 4-wheeled cargo item
    const fourWheeledItem = {
      mission_id: missionIdParam,
      cargo_type_id: fourWheeledTypeIdParam,
      name: 'Test 4-Wheeled Vehicle',
      weight: 2000,
      length: 120,
      width: 80,
      height: 60,
      forward_overhang: 15,
      back_overhang: 15,
      x_start_position: 120,
      y_start_position: 0,
    };
    const fourWheeledResult = await createCargoItem(fourWheeledItem);
    const createdFourWheeledCargoId = fourWheeledResult.results?.[0]?.lastInsertId || 3;

    return {
      bulkCargoId: createdBulkCargoId,
      twoWheeledCargoId: createdTwoWheeledCargoId,
      fourWheeledCargoId: createdFourWheeledCargoId,
    };
  }
});
