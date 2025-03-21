// Force unmock of modules we need for integration tests
jest.unmock('@/services/DatabaseService');
jest.unmock('better-sqlite3');
jest.unmock('@/services/TestDatabaseService');

// Now import the necessary modules
import { DatabaseFactory, DatabaseInterface } from '@/services/DatabaseService';
import { TestDatabaseService } from '@/services/TestDatabaseService';

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

describe('SQLite Integration Tests', () => {
  let dbService: DatabaseInterface;

  beforeAll(async () => {
    (DatabaseFactory as any).resetInstance();

    dbService = await DatabaseFactory.getDatabase();

    expect(dbService).toBeInstanceOf(TestDatabaseService);

    await dbService.initializeSchema(TEST_SCHEMA);

    dbService.loadTestData(TEST_DATA);
  });

  afterAll(() => {
    (DatabaseFactory as any).resetInstance();
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
});
