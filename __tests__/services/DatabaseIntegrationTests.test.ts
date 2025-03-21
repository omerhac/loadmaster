// Force unmock of modules we need for integration tests
jest.unmock('@/services/db/DatabaseService');
jest.unmock('better-sqlite3');
jest.unmock('@/services/db/TestDatabaseService');

// Now import the necessary modules
import { TestDatabaseService } from '@/services/db/TestDatabaseService';

const TEST_SCHEMA = `
  -- Test table for CRUD operations
  CREATE TABLE IF NOT EXISTS test_table (
    id INTEGER PRIMARY KEY,
    name TEXT,
    value TEXT
  );
  
  -- Sample application tables
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name TEXT
  );
  
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT
  );
`;

const TEST_DATA = `
  -- Seed data for the test_table
  INSERT INTO test_table (id, name, value) VALUES 
    (1, 'item1', 'value1'),
    (2, 'item2', 'value2'),
    (3, 'item3', 'value3');
    
  -- Seed data for sample tables
  INSERT INTO items (id, name) VALUES 
    (1, 'Item 1'),
    (2, 'Item 2');
    
  INSERT INTO categories (id, name) VALUES
    (1, 'Category A'),
    (2, 'Category B'),
    (3, 'Category C');
`;

describe('In-Memory SQLite Integration Tests', () => {
  let dbService: DatabaseInterface;

  beforeAll(async () => {
    // Use in-memory database for these tests
    dbService = await TestDatabaseService.initializeInMemory();

    await dbService.initializeSchema(TEST_SCHEMA);
    dbService.loadTestData(TEST_DATA);
  });

  afterAll(() => {
    TestDatabaseService.resetInstance();
  });

  it('should retrieve data from the database', async () => {
    const response = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [1]);

    expect(response.count).toBe(1);
    expect(response.results[0].data?.name).toBe('item1');
    expect(response.results[0].data?.value).toBe('value1');
  });

  it('should insert data into the database', async () => {
    const insertResponse = await dbService.executeQuery(
      'INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)',
      [4, 'item4', 'value4']
    );

    expect(insertResponse.results[0].changes).toBe(1);

    const selectResponse = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [4]);
    expect(selectResponse.count).toBe(1);
    expect(selectResponse.results[0].data?.name).toBe('item4');
  });

  it('should update data in the database', async () => {
    const updateResponse = await dbService.executeQuery(
      'UPDATE test_table SET value = ? WHERE id = ?',
      ['updated_value', 2]
    );

    expect(updateResponse.results[0].changes).toBe(1);

    const selectResponse = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [2]);
    expect(selectResponse.results[0].data?.value).toBe('updated_value');
  });

  it('should delete data from the database', async () => {
    const deleteResponse = await dbService.executeQuery('DELETE FROM test_table WHERE id = ?', [3]);

    expect(deleteResponse.results[0].changes).toBe(1);

    const selectResponse = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [3]);
    expect(selectResponse.count).toBe(0);
  });

  it('should execute transactions with multiple statements', async () => {
    const statements = [
      {
        sql: 'INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)',
        params: [5, 'transaction-item', 'transaction-value'],
      },
      {
        sql: 'UPDATE test_table SET value = ? WHERE id = ?',
        params: ['modified-in-transaction', 5],
      },
      {
        sql: 'SELECT * FROM test_table WHERE id = ?',
        params: [5],
      },
    ];

    const responses = await dbService.executeTransaction(statements);

    expect(responses.length).toBe(3);
    expect(responses[0].results[0].changes).toBe(1); // Insert
    expect(responses[1].results[0].changes).toBe(1); // Update
    expect(responses[2].count).toBe(1); // Select
    expect(responses[2].results[0].data?.value).toBe('modified-in-transaction');
  });

  it('should handle errors in queries', async () => {
    const response = await dbService.executeQuery('SELECT * FROM nonexistent_table');

    expect(response.error).toBeDefined();
    expect(response.results.length).toBe(0);
  });

  // New test for read-only database operations
  it('should perform various read-only operations on the database', async () => {
    // Basic SELECT with multiple results
    const allItemsResponse = await dbService.executeQuery('SELECT * FROM items ORDER BY id');
    expect(allItemsResponse.count).toBeGreaterThan(0);
    expect(allItemsResponse.results.length).toBeGreaterThan(0);
    expect(allItemsResponse.results[0].data).toBeDefined();
    expect(allItemsResponse.results[0].data?.id).toBe(1);

    // SELECT with WHERE clause
    const filteredCategoriesResponse = await dbService.executeQuery(
      'SELECT * FROM categories WHERE id > ?',
      [1]
    );
    expect(filteredCategoriesResponse.count).toBeGreaterThan(0);
    expect(filteredCategoriesResponse.results.some(result => result.data?.name === 'Category B')).toBe(true);

    // SELECT with aggregate function
    const countResponse = await dbService.executeQuery('SELECT COUNT(*) as count FROM categories');
    expect(countResponse.count).toBe(1);
    expect(countResponse.results[0].data?.count).toBe(3);

    // SELECT with JOIN
    const joinResponse = await dbService.executeQuery(`
      SELECT i.id as item_id, i.name as item_name, c.id as category_id, c.name as category_name
      FROM items i
      CROSS JOIN categories c
      LIMIT 3
    `);
    expect(joinResponse.count).toBe(3);
    expect(joinResponse.results[0].data?.item_id).toBeDefined();
    expect(joinResponse.results[0].data?.category_name).toBeDefined();

    // SELECT with LIKE
    const likeResponse = await dbService.executeQuery(
      'SELECT * FROM categories WHERE name LIKE ?',
      ['%B%']
    );
    expect(likeResponse.count).toBeGreaterThan(0);
    expect(likeResponse.results.some(result => result.data?.name === 'Category B')).toBe(true);
  });
});

// Test suite for testing the actual database file created by create-dummy-db.js
describe('Loadmaster SQLite File Database Tests', () => {
  let dbService: DatabaseInterface;

  beforeEach(async () => {
    TestDatabaseService.resetInstance();
    dbService = await TestDatabaseService.initialize();
  });

  afterAll(() => {
    TestDatabaseService.resetInstance();
  });

  it('should load and connect to the loadmaster database file by default', async () => {
    // Basic check that we can query the database
    const response = await dbService.executeQuery('SELECT * FROM products LIMIT 1');
    expect(response.count).toBe(1);
    expect(response.results[0].data).toBeDefined();
    expect(response.results[0].data?.name).toBeDefined();
  });

  it('should read the unique data from the loadmaster database', async () => {
    // Check for special product that only exists in loadmaster.db
    const specialProductResponse = await dbService.executeQuery(
      'SELECT * FROM products WHERE name = ?',
      ['LoadMaster Special Product']
    );

    expect(specialProductResponse.count).toBe(1);
    expect(specialProductResponse.results[0].data?.description).toBe('This is a unique product only found in loadmaster.db');
    expect(specialProductResponse.results[0].data?.weight).toBe(9.9);

    // Check for special category that only exists in loadmaster.db
    const specialCategoryResponse = await dbService.executeQuery(
      'SELECT * FROM categories WHERE name = ?',
      ['LoadMaster Special Category']
    );

    expect(specialCategoryResponse.count).toBe(1);
    expect(specialCategoryResponse.results[0].data?.description).toBe('This category only exists in the loadmaster.db file');
  });

  it('should read from the test_markers table that uniquely identifies this database', async () => {
    // Check that we can read the test markers
    const markersResponse = await dbService.executeQuery(
      'SELECT * FROM test_markers WHERE marker_name = ?',
      ['unique_test_marker']
    );

    expect(markersResponse.count).toBe(1);
    expect(markersResponse.results[0].data?.value).toBe('LoadMaster Special Test Database');

    // Check the database version marker
    const versionResponse = await dbService.executeQuery(
      'SELECT * FROM test_markers WHERE marker_name = ?',
      ['database_version']
    );

    expect(versionResponse.count).toBe(1);
    expect(versionResponse.results[0].data?.value).toBe('1.0');
  });

  it('should be able to perform complex queries on the loadmaster database', async () => {
    // Perform a JOIN between products and categories
    const joinResponse = await dbService.executeQuery(`
      SELECT p.id as product_id, p.name as product_name, 
             c.id as category_id, c.name as category_name
      FROM products p
      CROSS JOIN categories c
      WHERE p.name LIKE ? AND c.name LIKE ?
      LIMIT 3
    `, ['%Special%', '%Special%']);

    // We should have at least one result from the cross join
    expect(joinResponse.count).toBeGreaterThan(0);

    // The result should contain our special product and category
    const firstResult = joinResponse.results[0].data;
    expect(firstResult).toBeDefined();
    expect(firstResult?.product_name.includes('Special')).toBe(true);
    expect(firstResult?.category_name.includes('Special')).toBe(true);
  });
});
