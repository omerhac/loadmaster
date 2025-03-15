import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import {
  initDatabase,
  getDatabase,
  executeQuery,
} from '@/services/DatabaseService';

// Mock the dependencies
jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/document/directory',
  exists: jest.fn(),
  copyFileAssets: jest.fn(),
  copyFile: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android', // Will modify in individual tests
}));

describe('DatabaseService', () => {
  let mockDatabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase = {
      executeSql: jest.fn(),
    };
    (SQLite.openDatabase as jest.Mock).mockResolvedValue(mockDatabase);
  });

  describe('initDatabase', () => {
    test('should initialize database on Android', async () => {
      // Setup Platform mock
      (Platform.OS as string) = 'android';
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const db = await initDatabase();

      expect(RNFS.exists).toHaveBeenCalledWith('/mock/document/directory/loadmaster.db');
      expect(RNFS.copyFileAssets).toHaveBeenCalledWith('loadmaster.db', '/mock/document/directory/loadmaster.db');
      expect(SQLite.openDatabase).toHaveBeenCalledWith({
        name: '/mock/document/directory/loadmaster.db',
        location: 'default',
      });
      expect(db).toBe(mockDatabase);
    });

    test('should skip copying on Android if database already exists', async () => {
      // Setup Platform mock
      (Platform.OS as string) = 'android';
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const db = await initDatabase();

      expect(RNFS.exists).toHaveBeenCalledWith('/mock/document/directory/loadmaster.db');
      expect(RNFS.copyFileAssets).not.toHaveBeenCalled();
      expect(SQLite.openDatabase).toHaveBeenCalledWith({
        name: '/mock/document/directory/loadmaster.db',
        location: 'default',
      });
      expect(db).toBe(mockDatabase);
    });

    test('should initialize database on iOS', async () => {
      // Setup Platform mock
      (Platform.OS as string) = 'ios';

      const db = await initDatabase();

      expect(SQLite.openDatabase).toHaveBeenCalledWith({
        name: 'loadmaster.db',
        location: 'default',
        createFromLocation: 'loadmaster.db',
      });
      expect(db).toBe(mockDatabase);
    });

    test('should initialize database on Windows', async () => {
      // Setup Platform mock
      (Platform.OS as string) = 'windows';
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const db = await initDatabase();

      expect(RNFS.exists).toHaveBeenCalledWith('/mock/document/directory/loadmaster.db');
      expect(RNFS.copyFile).toHaveBeenCalledWith('ms-appx:///Assets/loadmaster.db', '/mock/document/directory/loadmaster.db');
      expect(SQLite.openDatabase).toHaveBeenCalledWith({
        name: 'loadmaster.db',
        location: 'default',
        createFromLocation: '/mock/document/directory/loadmaster.db',
      });
      expect(db).toBe(mockDatabase);
    });

    test('should handle database initialization error', async () => {
      (Platform.OS as string) = 'ios';
      const mockError = new Error('DB error');
      (SQLite.openDatabase as jest.Mock).mockRejectedValue(mockError);

      await expect(initDatabase()).rejects.toThrow('DB error');
    });
  });

  describe('getDatabase', () => {
    test('should return the database if initialized', async () => {
      // Initialize database first
      (Platform.OS as string) = 'ios';
      await initDatabase();

      // Now test getDatabase
      const db = getDatabase();
      expect(db).toBe(mockDatabase);
    });

    test('should throw error if database not initialized', () => {
      // Reset the database module state
      jest.resetModules();
      // Re-import to reset the internal database variable
      const { getDatabase: getDatabaseFn } = require('@/services/DatabaseService');

      expect(() => getDatabaseFn()).toThrow('Database not initialized. Call initDatabase first.');
    });
  });

  describe('executeQuery', () => {
    test('should execute query and return results', async () => {
      // Initialize database first
      (Platform.OS as string) = 'ios';
      await initDatabase();

      // Mock data for query results
      const mockRows = {
        length: 2,
        item: (i: number) => ({ id: i, name: `Item ${i}` }),
      };

      const mockResults = [{ rows: mockRows }];
      mockDatabase.executeSql.mockResolvedValue(mockResults);

      const result = await executeQuery('SELECT * FROM items', []);

      expect(mockDatabase.executeSql).toHaveBeenCalledWith('SELECT * FROM items', []);
      expect(result).toEqual([
        { id: 0, name: 'Item 0' },
        { id: 1, name: 'Item 1' },
      ]);
    });

    test('should handle query with parameters', async () => {
      // Initialize database first
      (Platform.OS as string) = 'ios';
      await initDatabase();

      // Mock data for query results
      const mockRows = {
        length: 1,
        item: (_: number) => ({ id: 1, name: 'Item 1' }),
      };

      const mockResults = [{ rows: mockRows }];
      mockDatabase.executeSql.mockResolvedValue(mockResults);

      const result = await executeQuery('SELECT * FROM items WHERE id = ?', [1]);

      expect(mockDatabase.executeSql).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [1]);
      expect(result).toEqual([{ id: 1, name: 'Item 1' }]);
    });

    test('should handle empty result set', async () => {
      // Initialize database first
      (Platform.OS as string) = 'ios';
      await initDatabase();

      // Mock data for empty results
      const mockRows = {
        length: 0,
        item: jest.fn(),
      };

      const mockResults = [{ rows: mockRows }];
      mockDatabase.executeSql.mockResolvedValue(mockResults);

      const result = await executeQuery('SELECT * FROM items WHERE id = ?', [999]);

      expect(mockDatabase.executeSql).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [999]);
      expect(result).toEqual([]);
    });

    test('should handle query execution error', async () => {
      // Initialize database first
      (Platform.OS as string) = 'ios';
      await initDatabase();

      const mockError = new Error('Query execution error');
      mockDatabase.executeSql.mockRejectedValue(mockError);

      await expect(executeQuery('INVALID SQL', [])).rejects.toThrow('Query execution error');
    });
  });

  describe('ReadOnly Data Access', () => {
    beforeEach(async () => {
      // Initialize database first
      (Platform.OS as string) = 'ios';
      await initDatabase();
    });

    test('should be able to read data from predefined tables', async () => {
      // Mock data for query results - simulating read-only reference data
      const mockRows = {
        length: 3,
        item: (i: number) => {
          const items = [
            { id: 1, name: 'Category A' },
            { id: 2, name: 'Category B' },
            { id: 3, name: 'Category C' },
          ];
          return items[i];
        },
      };

      const mockResults = [{ rows: mockRows }];
      mockDatabase.executeSql.mockResolvedValue(mockResults);

      const result = await executeQuery('SELECT * FROM categories', []);

      expect(mockDatabase.executeSql).toHaveBeenCalledWith('SELECT * FROM categories', []);
      expect(result).toEqual([
        { id: 1, name: 'Category A' },
        { id: 2, name: 'Category B' },
        { id: 3, name: 'Category C' },
      ]);
    });

    test('should handle filtering of read-only data', async () => {
      // Mock data for query results with filter
      const mockRows = {
        length: 1,
        item: (_: number) => ({ id: 2, name: 'Category B' }),
      };

      const mockResults = [{ rows: mockRows }];
      mockDatabase.executeSql.mockResolvedValue(mockResults);

      const result = await executeQuery('SELECT * FROM categories WHERE id = ?', [2]);

      expect(mockDatabase.executeSql).toHaveBeenCalledWith('SELECT * FROM categories WHERE id = ?', [2]);
      expect(result).toEqual([{ id: 2, name: 'Category B' }]);
    });
  });
});
