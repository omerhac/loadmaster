import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import { DatabaseResponse, SqlStatement, QueryResult } from './DatabaseTypes';

declare const process: {
  env: {
    NODE_ENV?: string;
  };
};


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
      console.log('Initializing database instance...');
      console.log('__DEV__:', __DEV__);
      console.log('NODE_ENV:', process.env.NODE_ENV);

      if (__DEV__ && process.env.NODE_ENV === 'test') {
        // For Jest tests, we'll use the TestDatabaseService
        console.log('Using TestDatabaseService for test environment');
        const { TestDatabaseService } = require('./TestDatabaseService');
        this.instance = await TestDatabaseService.initialize();
      } else {
        // For production app, use the native implementation
        console.log('Using NativeDatabaseService for production environment');
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

    if (Platform.OS === 'windows') {
      // Simplified Windows handling - let SQLite handle database creation
      console.log('Windows platform detected - using simplified database initialization');

      try {
        // Try to open the database directly - SQLite will create it if it doesn't exist
        const database = await SQLite.openDatabase({
          name: this.DATABASE_NAME,
          location: 'default',
        });
        console.log('Windows database opened successfully');
        return database;
      } catch (error) {
        console.log('Windows database open failed, trying alternative approach:', error);

        // Fallback: try with explicit path
        try {
          const database = await SQLite.openDatabase({
            name: this.DATABASE_NAME,
            location: 'Documents',
            createFromLocation: '~www/' + this.DATABASE_NAME,
          });
          console.log('Windows database opened with fallback method');
          return database;
        } catch (fallbackError) {
          console.log('Windows fallback also failed, creating new database:', fallbackError);

          // Last resort: create a new empty database
          const database = await SQLite.openDatabase({
            name: this.DATABASE_NAME,
            location: 'default',
          });
          console.log('Windows database created as new empty database');
          return database;
        }
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
      console.log('Starting schema initialization...');
      // Split the SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      console.log(`Executing ${statements.length} schema statements`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await this.database.executeSql(statement + ';');
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (statementError) {
          console.error(`Error executing statement ${i + 1}:`, statement);
          console.error('Statement error:', statementError);
          throw statementError;
        }
      }
      console.log('Schema initialization completed successfully');
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
          code: 'DB_ERROR',
        },
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
            data: result.rows.item(i),
          });
        }
        formattedResults.push(...rows);
        totalCount += result.rows.length;
      } else if (result.rowsAffected) {
        formattedResults.push({
          changes: result.rowsAffected,
          lastInsertId: result.insertId,
        });
      }
    }

    return {
      results: formattedResults,
      count: totalCount,
    };
  }
}
