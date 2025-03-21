import { DatabaseResponse } from '@/services/DatabaseTypes';
import { mockDatabaseService, executeQueryMock, initializeSchemaMock, executeTransactionMock } from './__mock__/mock-database';

// Mock the DatabaseFactory
jest.mock('@/services/DatabaseService', () => ({
  DatabaseFactory: {
    getDatabase: jest.fn().mockResolvedValue(mockDatabaseService),
    resetInstance: jest.fn(),
  },
}));

// Import after mocking
import { DatabaseFactory as MockedFactory } from '@/services/DatabaseService';

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
    const instance1 = await MockedFactory.getDatabase();

    jest.clearAllMocks();

    const instance2 = await MockedFactory.getDatabase();
    expect(instance1).toBe(instance2);
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
      const mockResponse: DatabaseResponse = {
        results: [
          { data: { id: 1, name: 'Test Item' } },
          { data: { id: 2, name: 'Another Item' } },
        ],
        count: 2,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      const dbService = await MockedFactory.getDatabase();

      const response = await dbService.executeQuery('SELECT * FROM items');

      expect(executeQueryMock).toHaveBeenCalledWith('SELECT * FROM items', []);

      expect(response).toEqual(mockResponse);
      expect(response.count).toBe(2);
      expect(response.results[0].data).toEqual({ id: 1, name: 'Test Item' });
    });

    test('should handle query parameters', async () => {
      const mockResponse: DatabaseResponse = {
        results: [{ data: { id: 1, name: 'Test Item' } }],
        count: 1,
      };

      executeQueryMock.mockResolvedValue(mockResponse);

      const dbService = await MockedFactory.getDatabase();

      const response = await dbService.executeQuery(
        'SELECT * FROM items WHERE id = ?',
        [1]
      );

      expect(executeQueryMock).toHaveBeenCalledWith(
        'SELECT * FROM items WHERE id = ?',
        [1]
      );

      expect(response.results[0].data).toEqual({ id: 1, name: 'Test Item' });
    });

    test('should handle errors', async () => {
      const errorResponse: DatabaseResponse = {
        results: [],
        count: 0,
        error: {
          message: 'SQL syntax error',
          code: 'SQLITE_ERROR',
        },
      };

      executeQueryMock.mockResolvedValue(errorResponse);

      const dbService = await MockedFactory.getDatabase();

      const response = await dbService.executeQuery('INVALID SQL');

      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('SQL syntax error');
    });
  });

  describe('initializeSchema', () => {
    test('should initialize database schema', async () => {
      initializeSchemaMock.mockResolvedValue(undefined);

      const testSchema = `
        CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);
        CREATE INDEX idx_name ON test_table(name);
      `;

      const dbService = await MockedFactory.getDatabase();

      await dbService.initializeSchema(testSchema);

      expect(initializeSchemaMock).toHaveBeenCalledWith(testSchema);
    });

    test('should handle schema initialization errors', async () => {
      const schemaError = new Error('Invalid SQL syntax in schema');
      initializeSchemaMock.mockRejectedValue(schemaError);

      const invalidSchema = 'CREATE INVALID TABLE';

      const dbService = await MockedFactory.getDatabase();

      await expect(dbService.initializeSchema(invalidSchema))
        .rejects.toThrow('Invalid SQL syntax in schema');

      expect(initializeSchemaMock).toHaveBeenCalledWith(invalidSchema);
    });
  });

  describe('executeTransaction', () => {
    test('should execute multiple SQL statements in a transaction', async () => {
      const mockResponses: DatabaseResponse[] = [
        {
          results: [{ changes: 1, lastInsertId: 5 }],
          count: 1,
        },
        {
          results: [{ changes: 1 }],
          count: 1,
        },
        {
          results: [{ data: { id: 5, name: 'New Item', updated: true } }],
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
          sql: 'UPDATE items SET updated = ? WHERE id = ?',
          params: [true, 5],
        },
        {
          sql: 'SELECT * FROM items WHERE id = ?',
          params: [5],
        },
      ];

      const dbService = await MockedFactory.getDatabase();

      const responses = await dbService.executeTransaction(statements);

      expect(executeTransactionMock).toHaveBeenCalledWith(statements);

      expect(responses).toEqual(mockResponses);
      expect(responses.length).toBe(3);
      expect(responses[0].results[0].lastInsertId).toBe(5);
      expect(responses[2].results[0].data?.name).toBe('New Item');
    });

    test('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed: foreign key constraint');
      executeTransactionMock.mockRejectedValue(transactionError);

      const statements = [
        {
          sql: 'INSERT INTO child_table (parent_id) VALUES (?)',
          params: [999], // Non-existent parent ID
        },
      ];

      const dbService = await MockedFactory.getDatabase();

      await expect(dbService.executeTransaction(statements))
        .rejects.toThrow('Transaction failed: foreign key constraint');

      expect(executeTransactionMock).toHaveBeenCalledWith(statements);
    });
  });
});
