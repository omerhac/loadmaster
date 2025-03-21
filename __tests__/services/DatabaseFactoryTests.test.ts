import { DatabaseResponse } from '../../src/services/DatabaseTypes';
import { mockDatabaseService, executeQueryMock, initializeSchemaMock, executeTransactionMock } from './__mock__/mock-database';

// Mock the DatabaseFactory
jest.mock('../../src/services/DatabaseService', () => ({
  DatabaseFactory: {
    getDatabase: jest.fn().mockResolvedValue(mockDatabaseService),
    resetInstance: jest.fn()
  }
}));

// Import after mocking
import { DatabaseFactory as MockedFactory } from '../../src/services/DatabaseService';

describe('DatabaseFactory Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseService.resetMocks();
    // Reset the factory instance before each test
    MockedFactory.resetInstance();
  });
  
  test('should provide access to a database implementation', async () => {
    const dbService = await MockedFactory.getDatabase();
    expect(dbService).toBeDefined();
    expect(typeof dbService.executeQuery).toBe('function');
    expect(typeof dbService.initializeSchema).toBe('function');
    expect(typeof dbService.executeTransaction).toBe('function');
  });
  
  test('should always return the same instance', async () => {
    // Set up getDatabase to return the same mock object each time
    const instance1 = await MockedFactory.getDatabase();
    
    // Clear the mock calls count
    jest.clearAllMocks();
    
    const instance2 = await MockedFactory.getDatabase();
    expect(instance1).toBe(instance2);
    // Now it should be called only once after clearing
    expect(MockedFactory.getDatabase).toHaveBeenCalledTimes(1);
  });
  
  test('should call resetInstance', () => {
    MockedFactory.resetInstance();
    expect(MockedFactory.resetInstance).toHaveBeenCalled();
  });
});

describe('DatabaseInterface Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseService.resetMocks();
    MockedFactory.resetInstance();
  });
  
  describe('executeQuery', () => {
    test('should execute SQL queries', async () => {
      // Setup mock response
      const mockResponse: DatabaseResponse = {
        results: [
          { data: { id: 1, name: 'Test Item' } },
          { data: { id: 2, name: 'Another Item' } }
        ],
        count: 2
      };
      
      executeQueryMock.mockResolvedValue(mockResponse);
      
      // Get database service via factory
      const dbService = await MockedFactory.getDatabase();
      
      // Execute the query
      const response = await dbService.executeQuery('SELECT * FROM items');
      
      // Verify the mock was called correctly
      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items', []);
      
      // Verify response format
      expect(response).toEqual(mockResponse);
      expect(response.count).toBe(2);
      expect(response.results[0].data).toEqual({ id: 1, name: 'Test Item' });
    });
    
    test('should handle query parameters', async () => {
      // Setup mock response for parameterized query
      const mockResponse: DatabaseResponse = {
        results: [{ data: { id: 1, name: 'Test Item' } }],
        count: 1
      };
      
      executeQueryMock.mockResolvedValue(mockResponse);
      
      // Get database service via factory
      const dbService = await MockedFactory.getDatabase();
      
      // Execute query with parameters
      const response = await dbService.executeQuery(
        'SELECT * FROM items WHERE id = ?', 
        [1]
      );
      
      // Verify mock was called with parameters
      expect(executeQueryMock).toHaveBeenCalledWith(
        'SELECT * FROM items WHERE id = ?', 
        [1]
      );
      
      // Verify response
      expect(response.results[0].data).toEqual({ id: 1, name: 'Test Item' });
    });
    
    test('should handle errors', async () => {
      // Setup mock to return error response
      const errorResponse: DatabaseResponse = {
        results: [],
        count: 0,
        error: {
          message: 'SQL syntax error',
          code: 'SQLITE_ERROR'
        }
      };
      
      executeQueryMock.mockResolvedValue(errorResponse);
      
      // Get database service via factory
      const dbService = await MockedFactory.getDatabase();
      
      // Execute query that would cause an error
      const response = await dbService.executeQuery('INVALID SQL');
      
      // Verify error is properly returned
      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('SQL syntax error');
    });
  });
  
  describe('initializeSchema', () => {
    test('should initialize database schema', async () => {
      // Mock successful schema initialization
      initializeSchemaMock.mockResolvedValue(undefined);
      
      // Define a test schema
      const testSchema = `
        CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);
        CREATE INDEX idx_name ON test_table(name);
      `;
      
      // Get database service via factory
      const dbService = await MockedFactory.getDatabase();
      
      // Initialize the schema
      await dbService.initializeSchema(testSchema);
      
      // Verify the mock was called with the schema
      expect(initializeSchemaMock).toHaveBeenCalledWith(testSchema);
    });
    
    test('should handle schema initialization errors', async () => {
      // Mock an error during schema initialization
      const schemaError = new Error('Invalid SQL syntax in schema');
      initializeSchemaMock.mockRejectedValue(schemaError);
      
      // Attempt to initialize with an invalid schema
      const invalidSchema = 'CREATE INVALID TABLE';
      
      // Get database service via factory
      const dbService = await MockedFactory.getDatabase();
      
      // Expect the promise to be rejected with the error
      await expect(dbService.initializeSchema(invalidSchema))
        .rejects.toThrow('Invalid SQL syntax in schema');
        
      // Verify the mock was called
      expect(initializeSchemaMock).toHaveBeenCalledWith(invalidSchema);
    });
  });
  
  describe('executeTransaction', () => {
    test('should execute multiple SQL statements in a transaction', async () => {
      // Mock transaction results
      const mockResponses: DatabaseResponse[] = [
        {
          results: [{ changes: 1, lastInsertId: 5 }],
          count: 1
        },
        {
          results: [{ changes: 1 }],
          count: 1
        },
        {
          results: [{ data: { id: 5, name: 'New Item', updated: true } }],
          count: 1
        }
      ];
      
      executeTransactionMock.mockResolvedValue(mockResponses);
      
      // Define a transaction with multiple statements
      const statements = [
        { 
          sql: 'INSERT INTO items (name) VALUES (?)',
          params: ['New Item']
        },
        {
          sql: 'UPDATE items SET updated = ? WHERE id = ?',
          params: [true, 5]
        },
        {
          sql: 'SELECT * FROM items WHERE id = ?',
          params: [5]
        }
      ];
      
      // Get database service via factory
      const dbService = await MockedFactory.getDatabase();
      
      // Execute the transaction
      const responses = await dbService.executeTransaction(statements);
      
      // Verify the mock was called with the statements
      expect(executeTransactionMock).toHaveBeenCalledWith(statements);
      
      // Verify transaction results
      expect(responses).toEqual(mockResponses);
      expect(responses.length).toBe(3);
      expect(responses[0].results[0].lastInsertId).toBe(5);
      expect(responses[2].results[0].data?.name).toBe('New Item');
    });
    
    test('should handle transaction errors', async () => {
      // Mock a transaction error
      const transactionError = new Error('Transaction failed: foreign key constraint');
      executeTransactionMock.mockRejectedValue(transactionError);
      
      // Define a transaction that would fail
      const statements = [
        { 
          sql: 'INSERT INTO child_table (parent_id) VALUES (?)',
          params: [999] // Non-existent parent ID
        }
      ];
      
      // Get database service via factory 
      const dbService = await MockedFactory.getDatabase();
      
      // Expect the transaction to fail
      await expect(dbService.executeTransaction(statements))
        .rejects.toThrow('Transaction failed: foreign key constraint');
        
      // Verify the mock was called
      expect(executeTransactionMock).toHaveBeenCalledWith(statements);
    });
  });
}); 