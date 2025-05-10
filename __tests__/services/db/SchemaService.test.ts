import { initializeLoadmasterDatabase, generateSchemaSQL, getSchemaDefinitions } from '../../../src/services/db/SchemaService';
import { TestDatabaseService } from '../../../src/services/db/TestDatabaseService';

describe('SchemaService Integration Tests', () => {
  let testDb: TestDatabaseService;


  beforeAll(async () => {
    testDb = await TestDatabaseService.initialize(true) as TestDatabaseService;

  });

  beforeEach(async () => {
    // Clear the database before each test
    try {
      TestDatabaseService.resetInstance();
      testDb = await TestDatabaseService.initialize(true) as TestDatabaseService;
    } catch (error) {
      // If tables don't exist yet, that's fine for some tests
      console.log('Could not clear tables, they may not exist yet');
    }
  });

  afterAll(async () => {
    // Reset the spy and database
    jest.restoreAllMocks();
  });

  it('should generate valid SQL schema', () => {
    const schema = generateSchemaSQL();

    // Verify schema contains all the expected tables
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS user');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS aircraft');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS mission');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS cargo_type');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS cargo_item');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS fuel_state');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS fuel_mac_quants');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS compartment');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS load_constraints');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS allowed_mac_constraints');
  });

  it('should return all schema definitions', () => {
    const schemas = getSchemaDefinitions();

    // Check if all expected schemas are returned
    expect(schemas.length).toBe(10);

    // Check for specific table names
    const tableNames = schemas.map(schema => schema.tableName);
    expect(tableNames).toContain('user');
    expect(tableNames).toContain('aircraft');
    expect(tableNames).toContain('mission');
    expect(tableNames).toContain('cargo_type');
    expect(tableNames).toContain('cargo_item');
    expect(tableNames).toContain('fuel_state');
    expect(tableNames).toContain('fuel_mac_quants');
    expect(tableNames).toContain('compartment');
    expect(tableNames).toContain('load_constraints');
    expect(tableNames).toContain('allowed_mac_constraints');
  });

  it('should initialize the database with all tables', async () => {

    await initializeLoadmasterDatabase(testDb);

    // Check if tables were created by querying the database
    const tables = await testDb.executeQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%';
    `);

    // Extract table names
    const tableNames = tables.results.map(result => result.data?.name);

    // Verify all tables exist
    expect(tableNames).toContain('user');
    expect(tableNames).toContain('aircraft');
    expect(tableNames).toContain('mission');
    expect(tableNames).toContain('cargo_type');
    expect(tableNames).toContain('cargo_item');
    expect(tableNames).toContain('fuel_state');
    expect(tableNames).toContain('fuel_mac_quants');
    expect(tableNames).toContain('compartment');
    expect(tableNames).toContain('load_constraints');
    expect(tableNames).toContain('allowed_mac_constraints');
  });

  describe('Table Relationship Tests', () => {
    // Set up test data for join tests
    beforeEach(async () => {
      await initializeLoadmasterDatabase(testDb);

      // Insert test user
      await testDb.executeQuery(`
        INSERT INTO user (id, username, last_login) 
        VALUES (1, 'testuser', '2023-01-01T00:00:00.000Z')
      `);

      // Insert test aircraft
      await testDb.executeQuery(`
        INSERT INTO aircraft (id, type, name, empty_weight, empty_mac, cargo_bay_width, 
                            treadways_width, treadways_dist_from_center, ramp_length, 
                            ramp_max_incline, ramp_min_incline) 
        VALUES (1, 'C-130', 'Hercules', 36000, 25.5, 10.3, 2.5, 1.2, 3.5, 15, 5)
      `);

      // Insert test mission
      await testDb.executeQuery(`
        INSERT INTO mission (id, name, created_date, modified_date, crew_weight, configuration_weights,
                           crew_gear_weight, food_weight, safety_gear_weight,
                           etc_weight, aircraft_id)
        VALUES (1, 'Test Mission', '2023-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z', 
              800, 150, 200, 100, 50, 75, 1)
      `);

      // Insert test cargo type
      await testDb.executeQuery(`
        INSERT INTO cargo_type (id, user_id, name, default_weight, default_length, 
                              default_width, default_height, default_forward_overhang, 
                              default_back_overhang, default_cog, type)
        VALUES (1, 1, 'Test Cargo', 1000, 5, 2, 2, 0.5, 0.5, 2.5, 'bulk')
      `);

      // Insert test cargo item
      await testDb.executeQuery(`
        INSERT INTO cargo_item (id, mission_id, cargo_type_id, name, weight, length, width, height, 
                              forward_overhang, back_overhang, cog, x_start_position, y_start_position)
        VALUES (1, 1, 1, 'Cargo Item 1', 1000, 5, 2, 2, 0.5, 0.5, 2.5, 10, 5)
      `);

      // Insert test fuel state
      await testDb.executeQuery(`
        INSERT INTO fuel_state (id, mission_id, total_fuel, main_tank_1_fuel, main_tank_2_fuel, 
                              main_tank_3_fuel, main_tank_4_fuel, external_1_fuel, 
                              external_2_fuel, mac_contribution)
        VALUES (1, 1, 5000, 1000, 1000, 1000, 1000, 500, 500, 2.5)
      `);

      // Insert test compartment
      await testDb.executeQuery(`
        INSERT INTO compartment (id, aircraft_id, name, x_start, x_end, floor_area, usable_volume)
        VALUES (1, 1, 'Main Compartment', 0, 20, 200, 600)
      `);

      // Insert test load constraint
      await testDb.executeQuery(`
        INSERT INTO load_constraints (id, compartment_id, max_cumulative_weight)
        VALUES (1, 1, 10000)
      `);

      // Insert test allowed MAC constraints
      await testDb.executeQuery(`
        INSERT INTO allowed_mac_constraints (id, gross_aircraft_weight, min_mac, max_mac)
        VALUES 
        (1, 160000, 15.0, 25.0),
        (2, 180000, 18.0, 28.0)
      `);
    });

    it('should verify mission to aircraft relationship', async () => {
      const result = await testDb.executeQuery(`
        SELECT m.id as mission_id, m.name as mission_name, 
               a.id as aircraft_id, a.name as aircraft_name, a.type
        FROM mission m
        JOIN aircraft a ON m.aircraft_id = a.id
        WHERE m.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.mission_name).toBe('Test Mission');
      expect(row?.aircraft_name).toBe('Hercules');
      expect(row?.type).toBe('C-130');
    });

    it('should verify cargo item to cargo type relationship', async () => {
      const result = await testDb.executeQuery(`
        SELECT ci.id as item_id, ci.name as item_name, 
               ci.weight, ci.length, ci.width, ci.height, ci.forward_overhang, ci.back_overhang,
               ct.id as type_id, ct.name as type_name, ct.type,
               ct.default_weight, ct.default_length, ct.default_width, ct.default_height,
               ct.default_forward_overhang, ct.default_back_overhang
        FROM cargo_item ci
        JOIN cargo_type ct ON ci.cargo_type_id = ct.id
        WHERE ci.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.item_name).toBe('Cargo Item 1');
      expect(row?.type_name).toBe('Test Cargo');
      expect(row?.type).toBe('bulk');

      // Verify the new cargo item fields match the initial values from cargo_type defaults
      expect(row?.weight).toBe(row?.default_weight);
      expect(row?.length).toBe(row?.default_length);
      expect(row?.width).toBe(row?.default_width);
      expect(row?.height).toBe(row?.default_height);
      expect(row?.forward_overhang).toBe(row?.default_forward_overhang);
      expect(row?.back_overhang).toBe(row?.default_back_overhang);
    });

    it('should verify cargo type to user relationship', async () => {
      const result = await testDb.executeQuery(`
        SELECT ct.id as type_id, ct.name as type_name,
               u.id as user_id, u.username
        FROM cargo_type ct
        JOIN user u ON ct.user_id = u.id
        WHERE ct.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.type_name).toBe('Test Cargo');
      expect(row?.username).toBe('testuser');
    });

    it('should verify mission to fuel state relationship', async () => {
      const result = await testDb.executeQuery(`
        SELECT m.id as mission_id, m.name as mission_name,
               fs.id as fuel_state_id, fs.total_fuel
        FROM mission m
        JOIN fuel_state fs ON m.id = fs.mission_id
        WHERE m.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.mission_name).toBe('Test Mission');
      expect(row?.total_fuel).toBe(5000);
    });

    it('should verify aircraft to compartment to load constraints relationships', async () => {
      const result = await testDb.executeQuery(`
        SELECT a.id as aircraft_id, a.name as aircraft_name,
               c.id as compartment_id, c.name as compartment_name,
               lc.id as constraint_id, lc.max_cumulative_weight
        FROM aircraft a
        JOIN compartment c ON a.id = c.aircraft_id
        JOIN load_constraints lc ON c.id = lc.compartment_id
        WHERE a.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.aircraft_name).toBe('Hercules');
      expect(row?.compartment_name).toBe('Main Compartment');
      expect(row?.max_cumulative_weight).toBe(10000);
    });

    it('should verify complex multi-table relationship (mission → aircraft → compartment)', async () => {
      const result = await testDb.executeQuery(`
        SELECT m.id as mission_id, m.name as mission_name,
               a.id as aircraft_id, a.name as aircraft_name,
               c.id as compartment_id, c.name as compartment_name
        FROM mission m
        JOIN aircraft a ON m.aircraft_id = a.id
        JOIN compartment c ON a.id = c.aircraft_id
        WHERE m.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.mission_name).toBe('Test Mission');
      expect(row?.aircraft_name).toBe('Hercules');
      expect(row?.compartment_name).toBe('Main Compartment');
    });

    it('should verify complete cargo loading chain (user → cargo type → cargo item → mission)', async () => {
      const result = await testDb.executeQuery(`
        SELECT u.username, 
               ct.name as cargo_type_name, ct.type as cargo_type,
               ci.name as cargo_item_name, 
               ci.weight, ci.length, ci.width, ci.height, ci.forward_overhang, ci.back_overhang,
               ci.x_start_position, ci.y_start_position,
               m.name as mission_name
        FROM user u
        JOIN cargo_type ct ON u.id = ct.user_id
        JOIN cargo_item ci ON ct.id = ci.cargo_type_id
        JOIN mission m ON ci.mission_id = m.id
        WHERE u.id = 1
      `);

      expect(result.count).toBe(1);
      const row = result.results[0].data;
      expect(row?.username).toBe('testuser');
      expect(row?.cargo_type_name).toBe('Test Cargo');
      expect(row?.cargo_item_name).toBe('Cargo Item 1');
      expect(row?.mission_name).toBe('Test Mission');
      expect(row?.x_start_position).toBe(10);
      expect(row?.y_start_position).toBe(5);

      expect(row?.weight).toBe(1000);
      expect(row?.length).toBe(5);
      expect(row?.width).toBe(2);
      expect(row?.height).toBe(2);
      expect(row?.forward_overhang).toBe(0.5);
      expect(row?.back_overhang).toBe(0.5);
    });

    it('should verify allowed MAC constraints data', async () => {
      const result = await testDb.executeQuery(`
        SELECT * FROM allowed_mac_constraints
        ORDER BY gross_aircraft_weight
      `);

      expect(result.count).toBe(2);
      const firstRow = result.results[0].data;
      const secondRow = result.results[1].data;

      expect(firstRow?.gross_aircraft_weight).toBe(160000);
      expect(firstRow?.min_mac).toBe(15.0);
      expect(firstRow?.max_mac).toBe(25.0);

      expect(secondRow?.gross_aircraft_weight).toBe(180000);
      expect(secondRow?.min_mac).toBe(18.0);
      expect(secondRow?.max_mac).toBe(28.0);
    });
  });
});
