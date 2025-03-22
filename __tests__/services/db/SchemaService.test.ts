import { initializeLoadmasterDatabase, generateSchemaSQL, getSchemaDefinitions } from '@/services/db/SchemaService';
import { TestDatabaseService } from '@/services/db/TestDatabaseService';

describe('SchemaService Integration Tests', () => {
  let testDb: TestDatabaseService;


  beforeAll(async () => {
    testDb = await TestDatabaseService.initialize(true) as TestDatabaseService;

  });

  beforeEach(async () => {
    // Clear the database before each test
    try {
      await TestDatabaseService.initialize(true) as TestDatabaseService;
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
  });
});
