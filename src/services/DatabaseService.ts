import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// For TypeScript Node.js types
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

// Check if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Conditionally import the test database service if we're in a test environment
// This avoids TypeScript errors about missing modules in production
let TestDatabaseService: any = null;
if (isTestEnvironment) {
  try {
    // This will only execute in Jest environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    TestDatabaseService = require('./TestDatabaseService').TestDatabaseService;
  } catch (error) {
    console.error('Error loading TestDatabaseService, make sure better-sqlite3 is installed');
  }
}

// DatabaseInterface defines the contract for database implementations
export interface DatabaseInterface {
  executeQuery(query: string, params?: any[]): Promise<any[]>;
  // Add other database operations as needed
}

// Factory to create the appropriate database implementation
export class DatabaseFactory {
  private static instance: DatabaseInterface | null = null;

  static async getDatabase(): Promise<DatabaseInterface> {
    if (!this.instance) {
      if (isTestEnvironment && TestDatabaseService) {
        // For Jest tests, we'll use the TestDatabaseService
        this.instance = await TestDatabaseService.initialize();
      } else {
        // For production app, use the native implementation
        this.instance = await NativeDatabaseService.initialize();
      }
    }
    
    // At this point, instance should be initialized
    if (!this.instance) {
      throw new Error('Failed to initialize a database implementation');
    }
    
    return this.instance;
  }
}

// Native implementation using react-native-sqlite-storage
export class NativeDatabaseService implements DatabaseInterface {
  private static instance: NativeDatabaseService | null = null;
  private database: SQLiteDatabase | null = null;
  // Make this static field accessible to the module for backward compatibility
  static DATABASE_NAME = 'loadmaster.db';

  private constructor(database: SQLiteDatabase) {
    this.database = database;
  }

  static async initialize(): Promise<NativeDatabaseService> {
    if (!this.instance) {
      // Enable SQLite Promises
      SQLite.enablePromise(true);
      
      const database = await this.openDatabase();
      this.instance = new NativeDatabaseService(database);
    }
    return this.instance;
  }

  private static async openDatabase(): Promise<SQLiteDatabase> {
    let databasePath: string = this.DATABASE_NAME;

    if (Platform.OS === 'android') {
      // Define writable location
      const writablePath = `${RNFS.DocumentDirectoryPath}/${this.DATABASE_NAME}`;

      // Check if DB already exists in writable location
      const exists = await RNFS.exists(writablePath);
      if (!exists) {
        // First run - copy the pre-populated DB from assets to writable location
        await RNFS.copyFileAssets(this.DATABASE_NAME, writablePath);
      }

      // Open the writable copy
      return await SQLite.openDatabase({
        name: writablePath,
        location: 'default',
      });
    } else if (Platform.OS === 'ios') {
      databasePath = this.DATABASE_NAME;
    } else if (Platform.OS === 'windows') {
      databasePath = `${RNFS.DocumentDirectoryPath}/${this.DATABASE_NAME}`;
      const exists = await RNFS.exists(databasePath);
      if (!exists) {
        const bundlePath = `ms-appx:///Assets/${this.DATABASE_NAME}`;
        await RNFS.copyFile(bundlePath, databasePath);
      }
    }

    try {
      const database = await SQLite.openDatabase({
        name: this.DATABASE_NAME,
        location: 'default',
        createFromLocation: databasePath,
      });
      console.log('Database initialized successfully');
      return database;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    if (!this.database) {
      throw new Error('Database not initialized.');
    }
    
    try {
      const [results] = await this.database.executeSql(query, params);
      const rows: any[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        rows.push(results.rows.item(i));
      }
      return rows;
    } catch (error) {
      console.error('Error executing query:', query, error);
      throw error;
    }
  }
}

// Legacy API compatibility - these will use the factory pattern internally
let g_database: SQLiteDatabase | null = null;

// Reset the global database when importing in tests
if (isTestEnvironment) {
  g_database = null;
}

export const initDatabase = async (): Promise<SQLiteDatabase> => {
  if (!g_database) {
    // In test environment, we need to make sure we're using mocked SQLite
    if (isTestEnvironment) {
      // This setup helps existing tests that directly mock SQLite.openDatabase
      const db = await SQLite.openDatabase({
        name: Platform.OS === 'android' 
          ? `${RNFS.DocumentDirectoryPath}/${NativeDatabaseService.DATABASE_NAME}`
          : NativeDatabaseService.DATABASE_NAME,
        location: 'default',
        createFromLocation: Platform.OS === 'windows'
          ? `${RNFS.DocumentDirectoryPath}/${NativeDatabaseService.DATABASE_NAME}` 
          : NativeDatabaseService.DATABASE_NAME,
      });
      g_database = db;
      return db;
    }
    
    // For production, use the NativeDatabaseService
    const nativeService = await NativeDatabaseService.initialize();
    // Fix the null assignment error with a non-null assertion since we know it exists after initialization
    g_database = (nativeService as any).database!;
  }
  return g_database!;
};

export const getDatabase = (): SQLiteDatabase => {
  if (!g_database) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return g_database;
};

export const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  if (isTestEnvironment && TestDatabaseService) {
    // For tests using our test database implementation
    try {
      const dbService = await DatabaseFactory.getDatabase();
      return dbService.executeQuery(query, params);
    } catch (error) {
      // If there's an error with our test DB, fall back to the mock behavior
      const db = getDatabase();
      try {
        const [results] = await db.executeSql(query, params);
        const rows: any[] = [];
        for (let i = 0; i < results.rows.length; i++) {
          rows.push(results.rows.item(i));
        }
        return rows;
      } catch (error) {
        console.error('Error executing query (legacy fallback):', query, error);
        throw error;
      }
    }
  } else {
    // For production
    const dbService = await DatabaseFactory.getDatabase();
    return dbService.executeQuery(query, params);
  }
};
