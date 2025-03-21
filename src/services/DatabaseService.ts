import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { DatabaseResponse, SqlStatement, QueryResult } from './DatabaseTypes';

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
  /**
   * Execute a SQL query and return the results in a standardized format
   * @param sql The SQL query to execute
   * @param params Optional parameters for the query
   * @returns A promise resolving to the database response
   */
  executeQuery(sql: string, params?: any[]): Promise<DatabaseResponse>;
  
  /**
   * Initialize the database schema
   * @param sql SQL to execute for schema initialization
   */
  initializeSchema(sql: string): Promise<void>;
  
  /**
   * Execute multiple statements in a transaction
   * @param statements Array of SQL statements to execute
   */
  executeTransaction(statements: SqlStatement[]): Promise<DatabaseResponse[]>;
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

  // For testing purposes only - allows resetting the singleton
  static resetInstance(): void {
    this.instance = null;
  }
}

// Native implementation using react-native-sqlite-storage
export class NativeDatabaseService implements DatabaseInterface {
  private static instance: NativeDatabaseService | null = null;
  private database: SQLiteDatabase | null = null;
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

  async initializeSchema(sql: string): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized.');
    }
    
    try {
      // Split the SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        await this.database.executeSql(statement + ';');
      }
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  async executeTransaction(statements: SqlStatement[]): Promise<DatabaseResponse[]> {
    if (!this.database) {
      throw new Error('Database not initialized.');
    }
    
    const results: DatabaseResponse[] = [];
    
    try {
      await this.database.transaction(async (tx) => {
        for (const stmt of statements) {
          const result = await tx.executeSql(stmt.sql, stmt.params || []);
          
          const response = this.formatQueryResponse(result);
          results.push(response);
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  }

  async executeQuery(sql: string, params: any[] = []): Promise<DatabaseResponse> {
    if (!this.database) {
      throw new Error('Database not initialized.');
    }
    
    try {
      const [results] = await this.database.executeSql(sql, params);
      return this.formatQueryResponse([results]);
    } catch (error) {
      console.error('Error executing query:', sql, error);
      return {
        results: [],
        count: 0,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'DB_ERROR'
        }
      };
    }
  }
  
  private formatQueryResponse(results: any[]): DatabaseResponse {
    const formattedResults: QueryResult[] = [];
    let totalCount = 0;
    
    for (const result of results) {
      if (result.rows && result.rows.length > 0) {
        const rows: QueryResult[] = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push({
            data: result.rows.item(i)
          });
        }
        formattedResults.push(...rows);
        totalCount += result.rows.length;
      } else if (result.rowsAffected) {
        formattedResults.push({
          changes: result.rowsAffected,
          lastInsertId: result.insertId
        });
      }
    }
    
    return {
      results: formattedResults,
      count: totalCount
    };
  }
}
