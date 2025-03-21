import { DatabaseFactory, initializeLoadmasterDatabase, generateSchemaSQL, getSchemaDefinitions } from '@/services/db/SchemaService';
import { TestDatabaseService } from '@/services/TestDatabaseService';

describe('SchemaService Integration Tests', () => {
  let testDb: TestDatabaseService;

  // Helper function to clear the database tables
  async function clearDatabaseTables(db: TestDatabaseService) {
    await db.executeQuery('DELETE FROM load_constraints;');
    await db.executeQuery('DELETE FROM compartment;');
    await db.executeQuery('DELETE FROM fuel_mac_quants;');
    await db.executeQuery('DELETE FROM fuel_state;');
    await db.executeQuery('DELETE FROM cargo_item;');
    await db.executeQuery('DELETE FROM cargo_type;');
    await db.executeQuery('DELETE FROM mission;');
    await db.executeQuery('DELETE FROM aircraft;');
    await db.executeQuery('DELETE FROM user;');
  }

  beforeAll(async () => {
    // Reset the database factory singleton for testing
    DatabaseFactory.resetInstance();

    // Get the test database service
    testDb = await TestDatabaseService.initialize() as TestDatabaseService;

    // Ensure it's used by the DatabaseFactory
    jest.spyOn(DatabaseFactory, 'getDatabase').mockResolvedValue(testDb);
  });

  beforeEach(async () => {
    // Clear the database before each test
    try {
      await clearDatabaseTables(testDb);
    } catch (error) {
      // If tables don't exist yet, that's fine for some tests
      console.log('Could not clear tables, they may not exist yet');
    }
  });

  afterAll(async () => {
    // Reset the spy and database
    jest.restoreAllMocks();
    try {
      await clearDatabaseTables(testDb);
    } catch (error) {
      console.log('Could not clear tables in afterAll');
    }
    DatabaseFactory.resetInstance();
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
  });

  it('should return all schema definitions', () => {
    const schemas = getSchemaDefinitions();

    // Check if all expected schemas are returned
    expect(schemas.length).toBe(9);

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
  });

  it('should initialize the database with all tables', async () => {
    // Spy on the initializeSchema method to ensure it's called
    const initSchemaSpy = jest.spyOn(testDb, 'initializeSchema');

    // Initialize the database
    await initializeLoadmasterDatabase();

    // Verify that initializeSchema was called
    expect(initSchemaSpy).toHaveBeenCalledTimes(1);

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
  });

  it('should create tables with correct columns and constraints', async () => {
    // Initialize the database
    await initializeLoadmasterDatabase();

    // Test for aircraft table structure
    const aircraftTableInfo = await testDb.executeQuery(`PRAGMA table_info(aircraft);`);
    const aircraftColumns = aircraftTableInfo.results.map(col => col.data?.name);

    expect(aircraftColumns).toContain('id');
    expect(aircraftColumns).toContain('type');
    expect(aircraftColumns).toContain('name');
    expect(aircraftColumns).toContain('empty_weight');
    expect(aircraftColumns).toContain('empty_mac');
    expect(aircraftColumns).toContain('cargo_bay_width');
    expect(aircraftColumns).toContain('treadways_width');
    expect(aircraftColumns).toContain('treadways_dist_from_center');
    expect(aircraftColumns).toContain('ramp_length');
    expect(aircraftColumns).toContain('ramp_max_incline');
    expect(aircraftColumns).toContain('ramp_min_incline');

    // Test for mission table foreign key
    const missionForeignKeys = await testDb.executeQuery(`PRAGMA foreign_key_list(mission);`);
    const missionFKs = missionForeignKeys.results.map(fk => ({
      table: fk.data?.table,
      from: fk.data?.from,
      to: fk.data?.to,
    }));

    expect(missionFKs).toContainEqual({
      table: 'aircraft',
      from: 'aircraft_id',
      to: 'id',
    });

    // Test for cargo_type enum constraint
    const cargoTypeInfo = await testDb.executeQuery(`PRAGMA table_info(cargo_type);`);
    const typeColumn = cargoTypeInfo.results.find(col => col.data?.name === 'type');

    expect(typeColumn?.data?.type).toBe('TEXT');
    // Check for enum constraint (SQLite stores this as a CHECK constraint)
    const cargoTypeSql = await testDb.executeQuery(`SELECT sql FROM sqlite_master WHERE name = 'cargo_type';`);
    const createSql = cargoTypeSql.results[0]?.data?.sql;

    expect(createSql).toContain("CHECK (type IN ('bulk', '2_wheeled', '4_wheeled'))");
  });
});
