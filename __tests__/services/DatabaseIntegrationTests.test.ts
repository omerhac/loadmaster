// Force unmock of modules we need for testing with better-sqlite3
jest.unmock('../../src/services/DatabaseService');
jest.unmock('better-sqlite3');
jest.unmock('../../src/services/TestDatabaseService');

// Now import the necessary modules
import { DatabaseFactory, DatabaseInterface } from '../../src/services/DatabaseService';
import { TestDatabaseService } from '../../src/services/TestDatabaseService';

// Make absolutely sure we're in test mode
process.env.NODE_ENV = 'test';

// Test schema definitions
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

// Test data to initialize tables
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

// Integration tests using an in-memory SQLite database
describe('SQLite Integration Tests', () => {
  let dbService: DatabaseInterface;
  
  beforeAll(async () => {
    // Reset the factory instance to ensure a clean state
    (DatabaseFactory as any).resetInstance();
    
    // Get the database instance - this should return the test implementation
    dbService = await DatabaseFactory.getDatabase();
    
    // Verify we're using the TestDatabaseService
    expect(dbService).toBeInstanceOf(TestDatabaseService);
    
    // Initialize the schema
    await dbService.initializeSchema(TEST_SCHEMA);
    
    // Load test data
    if (dbService instanceof TestDatabaseService) {
      dbService.loadTestData(TEST_DATA);
    } else {
      // If we're not using TestDatabaseService, use the standard interface
      const statements = TEST_DATA.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
        .map(stmt => ({ sql: stmt + ';' }));
      
      await dbService.executeTransaction(statements);
    }
  });
  
  afterAll(() => {
    // Reset the factory instance after all tests
    (DatabaseFactory as any).resetInstance();
  });
  
  it('should retrieve data from the database', async () => {
    // Query the database
    const response = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [1]);
    
    // Verify results
    expect(response.count).toBe(1);
    expect(response.results[0].data?.name).toBe('item1');
    expect(response.results[0].data?.value).toBe('value1');
  });
  
  it('should insert data into the database', async () => {
    // Insert a new row
    const insertResponse = await dbService.executeQuery(
      'INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)',
      [4, 'item4', 'value4']
    );
    
    // Verify the insertion was successful
    expect(insertResponse.results[0].changes).toBe(1);
    
    // Verify the data was inserted
    const selectResponse = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [4]);
    expect(selectResponse.count).toBe(1);
    expect(selectResponse.results[0].data?.name).toBe('item4');
  });
  
  it('should update data in the database', async () => {
    // Update a row
    const updateResponse = await dbService.executeQuery(
      'UPDATE test_table SET value = ? WHERE id = ?',
      ['updated_value', 2]
    );
    
    // Verify the update was successful
    expect(updateResponse.results[0].changes).toBe(1);
    
    // Verify the data was updated
    const selectResponse = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [2]);
    expect(selectResponse.results[0].data?.value).toBe('updated_value');
  });
  
  it('should delete data from the database', async () => {
    // Delete a row
    const deleteResponse = await dbService.executeQuery('DELETE FROM test_table WHERE id = ?', [3]);
    
    // Verify the deletion was successful
    expect(deleteResponse.results[0].changes).toBe(1);
    
    // Verify the deletion by querying for the deleted row
    const selectResponse = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [3]);
    expect(selectResponse.count).toBe(0);
  });
  
  it('should execute transactions with multiple statements', async () => {
    // Define a transaction with multiple statements
    const statements = [
      { 
        sql: 'INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)',
        params: [5, 'transaction-item', 'transaction-value']
      },
      {
        sql: 'UPDATE test_table SET value = ? WHERE id = ?',
        params: ['modified-in-transaction', 5]
      },
      {
        sql: 'SELECT * FROM test_table WHERE id = ?',
        params: [5]
      }
    ];
    
    // Execute the transaction
    const responses = await dbService.executeTransaction(statements);
    
    // Verify transaction results
    expect(responses.length).toBe(3);
    expect(responses[0].results[0].changes).toBe(1); // Insert
    expect(responses[1].results[0].changes).toBe(1); // Update
    expect(responses[2].count).toBe(1); // Select
    expect(responses[2].results[0].data?.value).toBe('modified-in-transaction');
  });
  
  it('should handle errors in queries', async () => {
    // Execute an invalid query
    const response = await dbService.executeQuery('SELECT * FROM nonexistent_table');
    
    // Verify error response
    expect(response.error).toBeDefined();
    expect(response.results.length).toBe(0);
  });
}); 