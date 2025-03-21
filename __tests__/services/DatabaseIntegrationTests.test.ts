// Force unmock of modules we need for testing with better-sqlite3
jest.unmock('@/services/DatabaseService');
jest.unmock('better-sqlite3');
jest.unmock('@/services/TestDatabaseService');

// Now import the necessary modules
import { DatabaseFactory, DatabaseInterface } from '@/services/DatabaseService';
import { TestDatabaseService } from '@/services/TestDatabaseService';

// Make absolutely sure we're in test mode
process.env.NODE_ENV = 'test';

// Separate describe block to avoid conflicts with other tests
describe('SQLite Integration Tests', () => {
  let dbService: DatabaseInterface;
  
  beforeAll(async () => {
    // Get the database instance - this should return the test implementation
    dbService = await DatabaseFactory.getDatabase();
    
    // Load sample test data if needed
    const testDb = dbService as TestDatabaseService;
    testDb.loadTestData(`
      INSERT INTO test_table (id, name, value) VALUES 
        (1, 'item1', 'value1'),
        (2, 'item2', 'value2'),
        (3, 'item3', 'value3');
    `);
  });
  
  it('should retrieve data from the database', async () => {
    // Query the database
    const results = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [1]);
    
    // Verify results
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('item1');
    expect(results[0].value).toBe('value1');
  });
  
  it('should insert data into the database', async () => {
    // Insert a new row
    await dbService.executeQuery(
      'INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)',
      [4, 'item4', 'value4']
    );
    
    // Verify the insertion
    const results = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [4]);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('item4');
  });
  
  it('should update data in the database', async () => {
    // Update a row
    await dbService.executeQuery(
      'UPDATE test_table SET value = ? WHERE id = ?',
      ['updated_value', 2]
    );
    
    // Verify the update
    const results = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [2]);
    expect(results[0].value).toBe('updated_value');
  });
  
  it('should delete data from the database', async () => {
    // Delete a row
    await dbService.executeQuery('DELETE FROM test_table WHERE id = ?', [3]);
    
    // Verify the deletion
    const results = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [3]);
    expect(results.length).toBe(0);
  });
}); 