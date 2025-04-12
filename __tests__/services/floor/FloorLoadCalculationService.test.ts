import { 
  calculateConcentratedLoad, 
  calculateLoadPerCompartment,
  calculateRunningLoad,
  WheelType, 
  LoadResult, 
  CompartmentLoadResult 
} from '../../../src/services/floor/FloorLoadCalculationService';
import { TestDatabaseService } from '../../../src/services/db/TestDatabaseService';
import { initializeLoadmasterDatabase } from '../../../src/services/db/SchemaService';
import { DatabaseFactory } from '../../../src/services/db/DatabaseService';

// Add integration flag to skip in CI/CD if needed
describe('Floor Load Calculation Integration Tests', () => {
  let testDb: TestDatabaseService;
  let createdCargoItemIds: number[] = [];

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
    await setupTestData();
    
    // Create actual test cargo items
    createdCargoItemIds = await createTestCargoItems();
  });

  afterEach(async () => {
    // Clean up created items
    await testDb.executeQuery('DELETE FROM cargo_item WHERE id IN (' + createdCargoItemIds.join(',') + ')');
    createdCargoItemIds = [];
  });

  describe('Integration Tests', () => {
    it('should calculate load values for bulk cargo', async () => {
      // Arrange
      const bulkCargoId = createdCargoItemIds[0];

      // Act - Calculate all three types of loads
      const concentratedLoad = await calculateConcentratedLoad(bulkCargoId);
      const loadPerCompartment = await calculateLoadPerCompartment(bulkCargoId);
      const runningLoad = await calculateRunningLoad(bulkCargoId);

      // Assert
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeGreaterThan(0);

      expect(loadPerCompartment).toBeDefined();
      expect(loadPerCompartment.length).toBeGreaterThanOrEqual(0);
      if (loadPerCompartment.length > 0) {
        expect(loadPerCompartment[0].load.unit).toBe('lbs');
      }

      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeGreaterThan(0);
    });

    it('should calculate load values for 2-wheeled cargo', async () => {
      // Arrange
      const twoWheeledCargoId = createdCargoItemIds[1];

      // Act - Calculate concentrated load
      const concentratedLoad = await calculateConcentratedLoad(twoWheeledCargoId);

      // Calculate load distribution
      const loadPerCompartment = await calculateLoadPerCompartment(twoWheeledCargoId);

      // Calculate running load
      const runningLoad = await calculateRunningLoad(twoWheeledCargoId);

      // Assert
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeGreaterThan(0);

      // Even if there are no compartments at the touchpoints, the result should be defined
      expect(loadPerCompartment).toBeDefined();

      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeGreaterThan(0);
    });

    it('should calculate load values for 4-wheeled cargo', async () => {
      // Arrange
      const fourWheeledCargoId = createdCargoItemIds[2];

      // Act - Calculate concentrated load
      const concentratedLoad = await calculateConcentratedLoad(fourWheeledCargoId);

      // Calculate load distribution
      const loadPerCompartment = await calculateLoadPerCompartment(fourWheeledCargoId);

      // Calculate running load
      const runningLoad = await calculateRunningLoad(fourWheeledCargoId);

      // Assert
      expect(concentratedLoad).toBeDefined();
      expect(concentratedLoad.unit).toBe('lbs/sq.in');
      expect(concentratedLoad.value).toBeGreaterThan(0);

      // Even if there are no compartments at the touchpoints, the result should be defined
      expect(loadPerCompartment).toBeDefined();

      expect(runningLoad).toBeDefined();
      expect(runningLoad.unit).toBe('lbs/in');
      expect(runningLoad.value).toBeGreaterThan(0);
    });
  });

  /**
   * Sets up test data in the database - creates required tables and base data
   */
  async function setupTestData(): Promise<void> {
    // Clear existing data
    await testDb.executeQuery('DELETE FROM cargo_item');
    await testDb.executeQuery('DELETE FROM cargo_type');
    await testDb.executeQuery('DELETE FROM compartment');
    await testDb.executeQuery('DELETE FROM mission');
    await testDb.executeQuery('DELETE FROM aircraft');

    // Create test aircraft
    await testDb.executeQuery(`
      INSERT INTO aircraft (id, type, name, empty_weight, empty_mac, cargo_bay_width, treadways_width, treadways_dist_from_center, ramp_length, ramp_max_incline, ramp_min_incline)
      VALUES (1, 'C-17', 'Test Aircraft', 100000, 30, 144, 22, 50, 300, 15, 5)
    `);

    // Create test mission
    await testDb.executeQuery(`
      INSERT INTO mission (id, name, created_date, modified_date, total_weight, total_mac_percent, crew_weight, aircraft_id)
      VALUES (1, 'Test Mission', '2023-01-01', '2023-01-01', 10000, 25, 800, 1)
    `);

    // Create test compartments
    await testDb.executeQuery(`
      INSERT INTO compartment (id, aircraft_id, name, x_start, x_end, floor_area, usable_volume)
      VALUES (1, 1, 'Compartment 1', 0, 100, 10000, 50000)
    `);
    
    await testDb.executeQuery(`
      INSERT INTO compartment (id, aircraft_id, name, x_start, x_end, floor_area, usable_volume)
      VALUES (2, 1, 'Compartment 2', 100, 200, 10000, 50000)
    `);

    // Create test cargo types
    await testDb.executeQuery(`
      INSERT INTO cargo_type (id, name, default_weight, default_length, default_width, default_height, default_forward_overhang, default_back_overhang, type)
      VALUES (1, 'Bulk Cargo', 1000, 20, 100, 50, 0, 0, 'bulk')
    `);
    
    await testDb.executeQuery(`
      INSERT INTO cargo_type (id, name, default_weight, default_length, default_width, default_height, default_forward_overhang, default_back_overhang, type)
      VALUES (2, 'Two Wheeled Vehicle', 1500, 80, 60, 70, 10, 10, '2_wheeled')
    `);
    
    await testDb.executeQuery(`
      INSERT INTO cargo_type (id, name, default_weight, default_length, default_width, default_height, default_forward_overhang, default_back_overhang, type)
      VALUES (3, 'Four Wheeled Vehicle', 2000, 120, 80, 60, 15, 15, '4_wheeled')
    `);
  }

  /**
   * Creates test cargo items that will be used in tests
   * @returns Array of created cargo item IDs
   */
  async function createTestCargoItems(): Promise<number[]> {
    const itemIds: number[] = [];
    
    // Create a bulk cargo item
    const bulkCargoResult = await testDb.executeQuery(`
      INSERT INTO cargo_item (mission_id, cargo_type_id, name, weight, length, width, height, forward_overhang, back_overhang, x_start_position, y_start_position)
      VALUES (1, 1, 'Test Bulk Cargo', 1000, 20, 100, 50, 0, 0, 50, 0)
    `);
    
    if (bulkCargoResult.results[0]?.lastInsertId) {
      itemIds.push(Number(bulkCargoResult.results[0].lastInsertId));
    }
    
    // Create a 2-wheeled cargo item
    const twoWheeledResult = await testDb.executeQuery(`
      INSERT INTO cargo_item (mission_id, cargo_type_id, name, weight, length, width, height, forward_overhang, back_overhang, x_start_position, y_start_position)
      VALUES (1, 2, 'Test 2-Wheeled Vehicle', 1500, 80, 60, 70, 10, 10, 30, 0)
    `);
    
    if (twoWheeledResult.results[0]?.lastInsertId) {
      itemIds.push(Number(twoWheeledResult.results[0].lastInsertId));
    }
    
    // Create a 4-wheeled cargo item
    const fourWheeledResult = await testDb.executeQuery(`
      INSERT INTO cargo_item (mission_id, cargo_type_id, name, weight, length, width, height, forward_overhang, back_overhang, x_start_position, y_start_position)
      VALUES (1, 3, 'Test 4-Wheeled Vehicle', 2000, 120, 80, 60, 15, 15, 120, 0)
    `);
    
    if (fourWheeledResult.results[0]?.lastInsertId) {
      itemIds.push(Number(fourWheeledResult.results[0].lastInsertId));
    }
    
    return itemIds;
  }
}); 