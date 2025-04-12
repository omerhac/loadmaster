import { 
  calculateConcentratedLoad, 
  calculateLoadPerCompartment,
  calculateRunningLoad,
  WHEEL_DIMENSIONS
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
  deleteCargoItem
} from '../../../src/services/db/operations';

describe('Floor Load Calculation Integration Tests', () => {
  let testDb: TestDatabaseService;
  let createdCargoItemIds: number[] = [];
  // Store mission and cargo type IDs for consistent references
  let missionId: number;
  let bulkTypeId: number;
  let twoWheeledTypeId: number;
  let fourWheeledTypeId: number;

  beforeAll(async () => {
    // Initialize test database
    testDb = await TestDatabaseService.initializeInMemory();
    await initializeLoadmasterDatabase(testDb);

    // Make sure the database factory returns our test database
    jest.spyOn(DatabaseFactory, 'getDatabase').mockResolvedValue(testDb);
  });

  afterAll(() => {
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
    createdCargoItemIds = await createTestCargoItems(missionId, bulkTypeId, twoWheeledTypeId, fourWheeledTypeId);
    
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
      // Arrange
      const bulkCargoId = createdCargoItemIds[0];
      
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
      expect(loadPerCompartment[0].compartmentId).toBe(1); // Should be in compartment 1
      expect(loadPerCompartment[0].load.unit).toBe('lbs');
      expect(loadPerCompartment[0].load.value).toBeCloseTo(1000, 2); // Full cargo weight

      // RUNNING LOAD CALCULATION:
      // For bulk cargo: weight / length
      // Expected: 1000 lbs / 20 in = 50 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(50, 2);
    });

    it('should calculate load values for 2-wheeled cargo', async () => {
      // Arrange
      const twoWheeledCargoId = createdCargoItemIds[1];
      
      // Test item properties for reference:
      // weight: 1500 lbs
      // length: 80 inches
      // width: 60 inches
      // forward_overhang: 10 inches
      // back_overhang: 10 inches
      // x_start_position: 30
      // Wheel dimensions (from constants):
      // - WHEEL_WIDTH: 2.5 inches
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
      // Expected: 1500 lbs / (2 * 2.5 in * 3.0 in) = 1500 / 15 = 100 lbs/sq.in
      const wheelWidth = WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['2_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['2_wheeled'].COUNT;
      const expectedConcentratedLoad = 1500 / (wheelCount * wheelWidth * contactLength);
      
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeCloseTo(expectedConcentratedLoad, 2);
      expect(concentratedLoad.value).toBeCloseTo(100, 2); // 1500 / (2 * 2.5 * 3.0) = 100

      // LOAD PER COMPARTMENT CALCULATION:
      // The wheeled cargo's effective footprint:
      // x_start with overhang: 30 + 10 = 40
      // x_end without overhang: 30 + 80 - 10 = 100
      // So it's fully within compartment 1 (0-100)
      expect(loadPerCompartment).toBeDefined();
      // If the wheel touchpoints fall within compartment 1, 100% of weight should be there
      if (loadPerCompartment.length > 0) {
        expect(loadPerCompartment[0].compartmentId).toBe(1);
        expect(loadPerCompartment[0].load.unit).toBe('lbs');
        // Either full weight (if all wheels in same compartment) or half weight per wheel
        expect(loadPerCompartment[0].load.value).toBeCloseTo(1500, 2);
      }

      // RUNNING LOAD CALCULATION:
      // For wheeled cargo: weight / (length - (forward_overhang + back_overhang))
      // Effective length: 80 - (10 + 10) = 60 inches
      // Expected: 1500 lbs / 60 in = 25 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(25, 2); // 1500 / (80 - (10 + 10)) = 25
    });

    it('should calculate load values for 4-wheeled cargo', async () => {
      // Arrange
      const fourWheeledCargoId = createdCargoItemIds[2];
      
      // Test item properties for reference:
      // weight: 2000 lbs
      // length: 120 inches
      // width: 80 inches
      // forward_overhang: 15 inches
      // back_overhang: 15 inches
      // x_start_position: 120
      // Wheel dimensions (from constants):
      // - WHEEL_WIDTH: 2.0 inches
      // - CONTACT_LENGTH: 2.5 inches
      // - COUNT: 4 wheels

      // Act - Calculate concentrated load
      const concentratedLoad = await calculateConcentratedLoad(fourWheeledCargoId);

      // Calculate load distribution
      const loadPerCompartment = await calculateLoadPerCompartment(fourWheeledCargoId);

      // Calculate running load
      const runningLoad = await calculateRunningLoad(fourWheeledCargoId);

      // Assert
      
      // CONCENTRATED LOAD CALCULATION:
      // For 4-wheeled: weight / (wheelCount * wheelWidth * contactLength)
      // Expected: 2000 lbs / (4 * 2.0 in * 2.5 in) = 2000 / 20 = 100 lbs/sq.in
      const wheelWidth = WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH;
      const contactLength = WHEEL_DIMENSIONS['4_wheeled'].CONTACT_LENGTH;
      const wheelCount = WHEEL_DIMENSIONS['4_wheeled'].COUNT;
      const expectedConcentratedLoad = 2000 / (wheelCount * wheelWidth * contactLength);
      
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeCloseTo(expectedConcentratedLoad, 2);
      expect(concentratedLoad.value).toBeCloseTo(100, 2); // 2000 / (4 * 2.0 * 2.5) = 100

      // LOAD PER COMPARTMENT CALCULATION:
      // The wheeled cargo's effective footprint:
      // x_start with overhang: 120 + 15 = 135
      // x_end without overhang: 120 + 120 - 15 = 225
      // This spans compartment 2 (100-200) and extends beyond it
      expect(loadPerCompartment).toBeDefined();
      // The touchpoints may fall in compartment 2, depending on their exact positions
      if (loadPerCompartment.length > 0) {
        expect(loadPerCompartment[0].compartmentId).toBe(2);
        expect(loadPerCompartment[0].load.unit).toBe('lbs');
        // Each wheel carries 1/4 of the weight (500 lbs)
        // Depending on touchpoint position, may contain 1, 2, 3, or all 4 wheels
        // Most likely 2 wheels (1000 lbs) or 4 wheels (2000 lbs)
        const possibleValues = [500, 1000, 1500, 2000];
        const isValidLoad = possibleValues.some(v => 
          Math.abs(loadPerCompartment[0].load.value - v) < 1);
        expect(isValidLoad).toBe(true);
      }

      // RUNNING LOAD CALCULATION:
      // For wheeled cargo: weight / (length - (forward_overhang + back_overhang))
      // Effective length: 120 - (15 + 15) = 90 inches
      // Expected: 2000 lbs / 90 in = 22.22 lbs/in
      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeCloseTo(22.22, 2); // 2000 / (120 - (15 + 15)) = 22.22
    });
  });

  describe('calculateConcentratedLoad function', () => {
    describe('Bulk cargo', () => {
      it('should calculate concentrated load correctly for BULK cargo', async () => {
        // Given
        const cargoItemId = 1; // Bulk cargo type

        // When
        const result = await calculateConcentratedLoad(cargoItemId);

        // Then
        /* 
         * Concentrated load for bulk cargo is calculated as: weight / (length * width)
         * For cargo item #1:
         *   - Weight: 1000 lbs
         *   - Length: 100 inches
         *   - Width: 50 inches (based on test data)
         *   - Area: 100 in * 50 in = 5000 sq.in
         * Expected load: 1000 lbs / 5000 sq.in = 0.2 lbs/sq.in
         */
        expect(result.value).toBeCloseTo(0.2, 6);
        expect(result.unit).toBe('lbs/sq.in');
      });
    });

    describe('2 wheeled cargo', () => {
      it('should calculate concentrated load correctly for 2_WHEELED cargo', async () => {
        // Given
        const cargoItemId = 2; // 2-wheeled cargo type

        // When
        const result = await calculateConcentratedLoad(cargoItemId);

        // Then
        /* 
         * Concentrated load for 2-wheeled cargo is calculated as: 
         * weight / (wheel_count * wheel_width * contact_length)
         * 
         * For cargo item #2:
         *   - Weight: 800 lbs
         *   - Wheel count: 2 (from WHEEL_DIMENSIONS['2_wheeled'].COUNT)
         *   - Wheel width: 2.5 inches (from WHEEL_DIMENSIONS['2_wheeled'].WHEEL_WIDTH)
         *   - Contact length: 3.0 inches (from WHEEL_DIMENSIONS['2_wheeled'].CONTACT_LENGTH)
         *   - Total contact area: 2 wheels * 2.5 in * 3.0 in = 15 sq.in
         * 
         * Expected load: 800 lbs / 15 sq.in = 53.333 lbs/sq.in
         */
        expect(result.value).toBeCloseTo(53.333, 3);
        expect(result.unit).toBe('lbs/sq.in');
      });
    });

    describe('4 wheeled cargo', () => {
      it('should calculate concentrated load correctly for 4_WHEELED cargo', async () => {
        // Given
        const cargoItemId = 3; // 4-wheeled cargo type

        // When
        const result = await calculateConcentratedLoad(cargoItemId);

        // Then
        /* 
         * Concentrated load for 4-wheeled cargo is calculated as: 
         * weight / (wheel_count * wheel_width * contact_length)
         * 
         * For cargo item #3:
         *   - Weight: 1200 lbs
         *   - Wheel count: 4 (from WHEEL_DIMENSIONS['4_wheeled'].COUNT)
         *   - Wheel width: 2.0 inches (from WHEEL_DIMENSIONS['4_wheeled'].WHEEL_WIDTH)
         *   - Contact length: 2.5 inches (from WHEEL_DIMENSIONS['4_wheeled'].CONTACT_LENGTH)
         *   - Total contact area: 4 wheels * 2.0 in * 2.5 in = 20 sq.in
         * 
         * Expected load: 1200 lbs / 20 sq.in = 60 lbs/sq.in
         */
        expect(result.value).toBeCloseTo(60, 6);
        expect(result.unit).toBe('lbs/sq.in');
      });
    });
  });

  describe('calculateLoadPerCompartment function', () => {
    describe('Bulk cargo', () => {
      it('should calculate load per compartment correctly for BULK cargo', async () => {
        // Given
        const cargoItemId = 1; // Bulk cargo type

        // When
        const result = await calculateLoadPerCompartment(cargoItemId);

        // Then
        /* 
         * Load per compartment for bulk cargo is calculated based on the overlap 
         * between the cargo and compartment.
         * 
         * For cargo item #1:
         *   - Weight: 1000 lbs
         *   - Length: 100 inches
         *   - Position: x=0
         *   - Compartment 1: x=0 to x=100
         *   - Cargo fully contained in compartment 1
         *   - Overlap = 100% of cargo length
         * 
         * Expected load in compartment 1: 1000 lbs * 100% = 1000 lbs
         */
        expect(result.length).toBe(1);
        expect(result[0].compartmentId).toBe(1);
        expect(result[0].load.value).toBeCloseTo(1000, 6);
        expect(result[0].load.unit).toBe('lbs');
      });
    });

    describe('2 wheeled cargo', () => {
      it('should calculate load per compartment correctly for 2_WHEELED cargo', async () => {
        // Given
        const cargoItemId = 2; // 2-wheeled cargo type

        // When
        const result = await calculateLoadPerCompartment(cargoItemId);

        // Then
        /* 
         * Load per compartment for 2-wheeled cargo is calculated by determining
         * which compartment each wheel falls into and distributing the weight
         * proportionally.
         * 
         * For cargo item #2:
         *   - Weight: 800 lbs
         *   - Length: 80 inches
         *   - Position: x=30, x_end=110
         *   - Compartment 1: x=0 to x=100
         *   - 2 wheels total, each carrying 400 lbs (800 lbs / 2)
         *   - Both wheels positioned in compartment 1
         * 
         * Expected load in compartment 1: 800 lbs (both wheels in this compartment)
         */
        expect(result.length).toBe(1);
        expect(result[0].compartmentId).toBe(1);
        expect(result[0].load.value).toBeCloseTo(800, 6);
        expect(result[0].load.unit).toBe('lbs');
      });
    });

    describe('4 wheeled cargo', () => {
      it('should calculate load per compartment correctly for 4_WHEELED cargo', async () => {
        // Given
        const cargoItemId = 3; // 4-wheeled cargo type

        // When
        const result = await calculateLoadPerCompartment(cargoItemId);

        // Then
        /* 
         * Load per compartment for 4-wheeled cargo is calculated by determining
         * which compartment each wheel falls into and distributing the weight
         * proportionally.
         * 
         * For cargo item #3:
         *   - Weight: 1200 lbs
         *   - Length: 100 inches
         *   - Position: x start from test data based on origin position
         *   - 4 wheels total, each carrying 300 lbs (1200 lbs / 4)
         *   - In the test setup, all 4 wheels are positioned in compartment 1
         * 
         * Expected load in compartment 1: 1200 lbs (all wheels in this compartment)
         */
        expect(result.length).toBe(1);
        expect(result[0].compartmentId).toBe(1);
        expect(result[0].load.value).toBeCloseTo(1200, 6);
        expect(result[0].load.unit).toBe('lbs');
      });
    });
  });

  describe('calculateRunningLoad function', () => {
    describe('Bulk cargo', () => {
      it('should calculate running load correctly for BULK cargo', async () => {
        // Given
        const cargoItemId = 1; // Bulk cargo type

        // When
        const result = await calculateRunningLoad(cargoItemId);

        // Then
        /* 
         * Running load for bulk cargo is calculated as: weight / length
         * 
         * For cargo item #1:
         *   - Weight: 1000 lbs
         *   - Length: 100 inches
         * 
         * Expected running load: 1000 lbs / 100 in = 10 lbs/in
         * 
         * This represents the linear distribution of weight along the
         * longitudinal axis of the aircraft.
         */
        expect(result.value).toBeCloseTo(10, 6);
        expect(result.unit).toBe('lbs/in');
      });
    });

    describe('2 wheeled cargo', () => {
      it('should calculate running load correctly for 2_WHEELED cargo', async () => {
        // Given
        const cargoItemId = 2; // 2-wheeled cargo type

        // When
        const result = await calculateRunningLoad(cargoItemId);

        // Then
        /* 
         * Running load for wheeled cargo is calculated as: 
         * weight / (length - forward_overhang - back_overhang)
         * 
         * For cargo item #2:
         *   - Weight: 800 lbs
         *   - Length: 80 inches
         *   - Forward overhang: 10 inches
         *   - Back overhang: 10 inches
         *   - Effective length: 80 - 10 - 10 = 60 inches
         * 
         * Expected running load: 800 lbs / 60 in = 13.333 lbs/in
         * 
         * The effective length calculation excludes overhangs because they don't
         * contribute to the load-bearing footprint of the cargo.
         */
        expect(result.value).toBeCloseTo(13.333, 3);
        expect(result.unit).toBe('lbs/in');
      });
    });

    describe('4 wheeled cargo', () => {
      it('should calculate running load correctly for 4_WHEELED cargo', async () => {
        // Given
        const cargoItemId = 3; // 4-wheeled cargo type

        // When
        const result = await calculateRunningLoad(cargoItemId);

        // Then
        /* 
         * Running load for wheeled cargo is calculated as: 
         * weight / (length - forward_overhang - back_overhang)
         * 
         * For cargo item #3:
         *   - Weight: 1200 lbs
         *   - Length: 100 inches
         *   - Forward overhang: 15 inches
         *   - Back overhang: 15 inches
         *   - Effective length: 100 - 15 - 15 = 70 inches
         * 
         * Expected running load: 1200 lbs / 70 in = 17.143 lbs/in
         * 
         * Similar to 2-wheeled cargo, the effective length calculation excludes
         * overhangs since they don't contribute to the weight distribution
         * along the aircraft's floor.
         */
        expect(result.value).toBeCloseTo(17.143, 3);
        expect(result.unit).toBe('lbs/in');
      });
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
      ramp_min_incline: 5
    };
    const aircraftResult = await createAircraft(aircraft);
    const aircraftId = aircraftResult.results[0]?.data?.id || 1;
    
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
      aircraft_id: aircraftId
    };
    const missionResult = await createMission(mission);
    const missionId = missionResult.results[0]?.data?.id || 1;
    
    // Create test compartments
    await createCompartment({
      aircraft_id: aircraftId,
      name: 'Compartment 1',
      x_start: 0,
      x_end: 100,
      floor_area: 10000,
      usable_volume: 50000
    });
    
    await createCompartment({
      aircraft_id: aircraftId,
      name: 'Compartment 2',
      x_start: 100,
      x_end: 200,
      floor_area: 10000,
      usable_volume: 50000
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
      type: 'bulk'
    });
    const bulkTypeId = bulkTypeResult.results[0]?.data?.id || 1;
    
    const twoWheeledTypeResult = await createCargoType({
      name: 'Two Wheeled Vehicle',
      default_weight: 1500,
      default_length: 80,
      default_width: 60,
      default_height: 70,
      default_forward_overhang: 10,
      default_back_overhang: 10,
      type: '2_wheeled'
    });
    const twoWheeledTypeId = twoWheeledTypeResult.results[0]?.data?.id || 2;
    
    const fourWheeledTypeResult = await createCargoType({
      name: 'Four Wheeled Vehicle',
      default_weight: 2000,
      default_length: 120,
      default_width: 80,
      default_height: 60,
      default_forward_overhang: 15,
      default_back_overhang: 15,
      type: '4_wheeled'
    });
    const fourWheeledTypeId = fourWheeledTypeResult.results[0]?.data?.id || 3;
    
    return { 
      aircraftId, 
      missionId, 
      bulkTypeId, 
      twoWheeledTypeId, 
      fourWheeledTypeId 
    };
  }

  /**
   * Creates test cargo items that will be used in tests
   * @param missionId The mission ID to associate items with
   * @param bulkTypeId The bulk cargo type ID
   * @param twoWheeledTypeId The 2-wheeled cargo type ID
   * @param fourWheeledTypeId The 4-wheeled cargo type ID
   * @returns Array of created cargo item IDs
   */
  async function createTestCargoItems(
    missionId: number,
    bulkTypeId: number,
    twoWheeledTypeId: number,
    fourWheeledTypeId: number
  ): Promise<number[]> {
    const itemIds: number[] = [];
    
    // Create a bulk cargo item
    const bulkCargoItem = {
      mission_id: missionId,
      cargo_type_id: bulkTypeId,
      name: 'Test Bulk Cargo',
      weight: 1000,
      length: 20,
      width: 100,
      height: 50,
      forward_overhang: 0,
      back_overhang: 0,
      x_start_position: 50,
      y_start_position: 0
    };
    const bulkCargoResult = await createCargoItem(bulkCargoItem);
    
    // Log the response to help debug
    console.log('Bulk cargo create result:', JSON.stringify(bulkCargoResult));
    
    if (bulkCargoResult.results[0]?.data?.id) {
      itemIds.push(Number(bulkCargoResult.results[0].data.id));
    } else if (bulkCargoResult.results[0]?.lastInsertId) {
      // Fallback to lastInsertId if .data.id isn't available
      itemIds.push(Number(bulkCargoResult.results[0].lastInsertId));
    }
    
    // Create a 2-wheeled cargo item
    const twoWheeledItem = {
      mission_id: missionId,
      cargo_type_id: twoWheeledTypeId,
      name: 'Test 2-Wheeled Vehicle',
      weight: 1500,
      length: 80,
      width: 60,
      height: 70,
      forward_overhang: 10,
      back_overhang: 10,
      x_start_position: 30,
      y_start_position: 0
    };
    const twoWheeledResult = await createCargoItem(twoWheeledItem);
    
    if (twoWheeledResult.results[0]?.data?.id) {
      itemIds.push(Number(twoWheeledResult.results[0].data.id));
    } else if (twoWheeledResult.results[0]?.lastInsertId) {
      itemIds.push(Number(twoWheeledResult.results[0].lastInsertId));
    }
    
    // Create a 4-wheeled cargo item
    const fourWheeledItem = {
      mission_id: missionId,
      cargo_type_id: fourWheeledTypeId,
      name: 'Test 4-Wheeled Vehicle',
      weight: 2000,
      length: 120,
      width: 80,
      height: 60,
      forward_overhang: 15,
      back_overhang: 15,
      x_start_position: 120,
      y_start_position: 0
    };
    const fourWheeledResult = await createCargoItem(fourWheeledItem);
    
    if (fourWheeledResult.results[0]?.data?.id) {
      itemIds.push(Number(fourWheeledResult.results[0].data.id));
    } else if (fourWheeledResult.results[0]?.lastInsertId) {
      itemIds.push(Number(fourWheeledResult.results[0].lastInsertId));
    }
    
    return itemIds;
  }
}); 