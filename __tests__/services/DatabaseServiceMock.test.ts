import { DatabaseResponse } from '../../src/services/DatabaseTypes';
import { mockDatabaseService, executeQueryMock, initializeSchemaMock, executeTransactionMock } from './__mock__/mock-database';

// Mock the DatabaseFactory to return our mock service
jest.mock('../../src/services/DatabaseService', () => ({
  DatabaseFactory: {
    getDatabase: jest.fn().mockResolvedValue(mockDatabaseService),
    resetInstance: jest.fn(),
  },
}));

// Import after mocking
import { DatabaseFactory } from '../../src/services/DatabaseService';

describe('Database Service Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseService.resetMocks();
  });

  describe('executeQuery', () => {
    test('should execute query and return results', async () => {
      // Setup mock response
      const mockResponse: DatabaseResponse = {
        results: [
          { data: { id: 0, name: 'Item 0' } },
          { data: { id: 1, name: 'Item 1' } },
        ],
        count: 2,
      };

      // Configure the mock to return our response
      executeQueryMock.mockResolvedValue(mockResponse);

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Execute the query
      const response = await dbService.executeQuery('SELECT * FROM items');

      // Verify mock was called with correct parameters
      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items', []);

      // Verify result
      expect(response.count).toBe(2);
      expect(response.results[0].data).toEqual({ id: 0, name: 'Item 0' });
      expect(response.results[1].data).toEqual({ id: 1, name: 'Item 1' });
    });

    test('should handle query with parameters', async () => {
      // Setup mock response for specific item
      const mockResponse: DatabaseResponse = {
        results: [{ data: { id: 1, name: 'Item 1' } }],
        count: 1,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Execute the query with parameters
      const response = await dbService.executeQuery('SELECT * FROM items WHERE id = ?', [1]);

      // Verify mock was called with correct parameters
      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [1]);

      // Verify result
      expect(response.count).toBe(1);
      expect(response.results[0].data).toEqual({ id: 1, name: 'Item 1' });
    });

    test('should handle empty result set', async () => {
      // Setup mock response for empty results
      const mockResponse: DatabaseResponse = {
        results: [],
        count: 0,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Execute the query that returns no results
      const response = await dbService.executeQuery('SELECT * FROM items WHERE id = ?', [999]);

      // Verify mock was called with correct parameters
      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [999]);

      // Verify empty result
      expect(response.count).toBe(0);
      expect(response.results).toHaveLength(0);
    });

    test('should handle query execution error', async () => {
      // Setup mock to reject with error
      executeQueryMock.mockRejectedValue(new Error('Query execution error'));

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Verify the error is properly thrown
      await expect(dbService.executeQuery('INVALID SQL', []))
        .rejects.toThrow('Query execution error');

      // Verify mock was called with correct parameters
      expect(executeQueryMock).toHaveBeenCalledWith('INVALID SQL', []);
    });

    test('should handle error response', async () => {
      // Setup mock to return error response object
      const errorResponse: DatabaseResponse = {
        results: [],
        count: 0,
        error: {
          message: 'SQL syntax error',
          code: 'SYNTAX_ERROR',
        },
      };

      executeQueryMock.mockResolvedValue(errorResponse);

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Execute query that would cause an error
      const response = await dbService.executeQuery('INVALID SQL');

      // Verify error is properly returned in response object
      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('SQL syntax error');
      expect(response.error?.code).toBe('SYNTAX_ERROR');
    });
  });

  describe('initializeSchema', () => {
    test('should initialize schema from SQL', async () => {
      // Mock successful schema initialization
      initializeSchemaMock.mockResolvedValue(undefined);

      // Sample schema
      const schema = `
        CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT);
      `;

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Call initializeSchema
      await dbService.initializeSchema(schema);

      // Verify mock was called with the schema
      expect(initializeSchemaMock).toHaveBeenCalledWith(schema);
    });

    test('should handle schema initialization error', async () => {
      // Mock schema initialization error
      const schemaError = new Error('Invalid schema syntax');
      initializeSchemaMock.mockRejectedValue(schemaError);

      // Sample invalid schema
      const invalidSchema = 'CREATE INVALID TABLE';

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Verify error is thrown
      await expect(dbService.initializeSchema(invalidSchema))
        .rejects.toThrow('Invalid schema syntax');

      // Verify mock was called with the schema
      expect(initializeSchemaMock).toHaveBeenCalledWith(invalidSchema);
    });
  });

  describe('executeTransaction', () => {
    test('should execute statements in a transaction', async () => {
      // Mock transaction results
      const mockResponses: DatabaseResponse[] = [
        {
          results: [{ changes: 1, lastInsertId: 1 }],
          count: 1,
        },
        {
          results: [{ data: { id: 1, name: 'New Item' } }],
          count: 1,
        },
      ];

      executeTransactionMock.mockResolvedValue(mockResponses);

      // Transaction statements
      const statements = [
        {
          sql: 'INSERT INTO items (name) VALUES (?)',
          params: ['New Item'],
        },
        {
          sql: 'SELECT * FROM items WHERE id = ?',
          params: [1],
        },
      ];

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Execute the transaction
      const responses = await dbService.executeTransaction(statements);

      // Verify mock was called with the statements
      expect(executeTransactionMock).toHaveBeenCalledWith(statements);

      // Verify results
      expect(responses).toEqual(mockResponses);
      expect(responses[0].results[0].changes).toBe(1);
      expect(responses[0].results[0].lastInsertId).toBe(1);
      expect(responses[1].results[0].data).toEqual({ id: 1, name: 'New Item' });
    });

    test('should handle transaction error', async () => {
      // Mock transaction error
      const transactionError = new Error('Transaction failed');
      executeTransactionMock.mockRejectedValue(transactionError);

      // Transaction statements
      const statements = [
        {
          sql: 'INSERT INTO invalid_table (name) VALUES (?)',
          params: ['New Item'],
        },
      ];

      // Get database service via factory
      const dbService = await DatabaseFactory.getDatabase();

      // Verify error is thrown
      await expect(dbService.executeTransaction(statements))
        .rejects.toThrow('Transaction failed');

      // Verify mock was called with the statements
      expect(executeTransactionMock).toHaveBeenCalledWith(statements);
    });
  });
});
