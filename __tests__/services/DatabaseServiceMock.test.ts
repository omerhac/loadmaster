import { DatabaseResponse } from '@/services/db/DatabaseTypes';
import { mockDatabaseService, executeQueryMock, initializeSchemaMock, executeTransactionMock } from './__mock__/mock-database';

// Mock the DatabaseFactory to return our mock service
jest.mock('@/services/db/DatabaseService', () => ({
  DatabaseFactory: {
    getDatabase: jest.fn().mockResolvedValue(mockDatabaseService),
    resetInstance: jest.fn(),
  },
}));

// Import after mocking
import { DatabaseFactory } from '@/services/db/DatabaseService';

describe('Database Service Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseService.resetMocks();
  });

  describe('executeQuery', () => {
    test('should execute query and return results', async () => {
      const mockResponse: DatabaseResponse = {
        results: [
          { data: { id: 0, name: 'Item 0' } },
          { data: { id: 1, name: 'Item 1' } },
        ],
        count: 2,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      const dbService = await DatabaseFactory.getDatabase();

      const response = await dbService.executeQuery('SELECT * FROM items');

      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items', []);

      expect(response.count).toBe(2);
      expect(response.results[0].data).toEqual({ id: 0, name: 'Item 0' });
      expect(response.results[1].data).toEqual({ id: 1, name: 'Item 1' });
    });

    test('should handle query with parameters', async () => {
      const mockResponse: DatabaseResponse = {
        results: [{ data: { id: 1, name: 'Item 1' } }],
        count: 1,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      const dbService = await DatabaseFactory.getDatabase();

      const response = await dbService.executeQuery('SELECT * FROM items WHERE id = ?', [1]);

      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [1]);

      expect(response.count).toBe(1);
      expect(response.results[0].data).toEqual({ id: 1, name: 'Item 1' });
    });

    test('should handle empty result set', async () => {
      const mockResponse: DatabaseResponse = {
        results: [],
        count: 0,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      const dbService = await DatabaseFactory.getDatabase();

      const response = await dbService.executeQuery('SELECT * FROM items WHERE id = ?', [999]);

      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [999]);

      expect(response.count).toBe(0);
      expect(response.results).toHaveLength(0);
    });

    test('should handle query execution error', async () => {
      executeQueryMock.mockRejectedValue(new Error('Query execution error'));

      const dbService = await DatabaseFactory.getDatabase();

      await expect(dbService.executeQuery('INVALID SQL', []))
        .rejects.toThrow('Query execution error');

      expect(executeQueryMock).toHaveBeenCalledWith('INVALID SQL', []);
    });

    test('should handle error response', async () => {
      const errorResponse: DatabaseResponse = {
        results: [],
        count: 0,
        error: {
          message: 'SQL syntax error',
          code: 'SYNTAX_ERROR',
        },
      };

      executeQueryMock.mockResolvedValue(errorResponse);

      const dbService = await DatabaseFactory.getDatabase();

      const response = await dbService.executeQuery('INVALID SQL');

      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('SQL syntax error');
      expect(response.error?.code).toBe('SYNTAX_ERROR');
    });
  });

  describe('initializeSchema', () => {
    test('should initialize schema from SQL', async () => {
      initializeSchemaMock.mockResolvedValue(undefined);

      const schema = `
        CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT);
      `;

      const dbService = await DatabaseFactory.getDatabase();

      await dbService.initializeSchema(schema);

      expect(initializeSchemaMock).toHaveBeenCalledWith(schema);
    });

    test('should handle schema initialization error', async () => {
      const schemaError = new Error('Invalid schema syntax');
      initializeSchemaMock.mockRejectedValue(schemaError);

      const invalidSchema = 'CREATE INVALID TABLE';

      const dbService = await DatabaseFactory.getDatabase();

      await expect(dbService.initializeSchema(invalidSchema))
        .rejects.toThrow('Invalid schema syntax');

      expect(initializeSchemaMock).toHaveBeenCalledWith(invalidSchema);
    });
  });

  describe('executeTransaction', () => {
    test('should execute statements in a transaction', async () => {
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

      const dbService = await DatabaseFactory.getDatabase();

      const responses = await dbService.executeTransaction(statements);

      expect(executeTransactionMock).toHaveBeenCalledWith(statements);

      expect(responses).toEqual(mockResponses);
      expect(responses[0].results[0].changes).toBe(1);
      expect(responses[0].results[0].lastInsertId).toBe(1);
      expect(responses[1].results[0].data).toEqual({ id: 1, name: 'New Item' });
    });

    test('should handle transaction error', async () => {
      const transactionError = new Error('Transaction failed');
      executeTransactionMock.mockRejectedValue(transactionError);

      const statements = [
        {
          sql: 'INSERT INTO invalid_table (name) VALUES (?)',
          params: ['New Item'],
        },
      ];

      const dbService = await DatabaseFactory.getDatabase();

      await expect(dbService.executeTransaction(statements))
        .rejects.toThrow('Transaction failed');

      expect(executeTransactionMock).toHaveBeenCalledWith(statements);
    });
  });
});
