import { DatabaseInterface } from './DatabaseService';
import { DatabaseResponse, SqlStatement } from './DatabaseTypes';
import path from 'path';

/**
 * Implementation of DatabaseInterface for test environments using better-sqlite3.
 * This class is only used in Jest test environments.
 */
export class TestDatabaseService implements DatabaseInterface {
  private static instance: TestDatabaseService | null = null;
  private db: any; // We'll use any type here to avoid importing better-sqlite3 in production code
  private static readonly DATABASE_NAME = 'loadmaster.db';

  private constructor(database: any) {
    this.db = database;
  }

  /**
   * Initialize the test database service.
   * By default, loads data from the loadmaster.db file.
   * Creates a singleton instance to be reused across tests.
   */
  static async initialize(): Promise<TestDatabaseService> {
    if (!this.instance) {
      try {
        // Try to load from the loadmaster.db file
        // Construct an absolute path that should work in Jest environment
        const dbPath = path.resolve(__dirname, '../../assets/database/loadmaster.db');
        console.log('Attempting to load database from path:', dbPath);

        return this.initializeFromFile(dbPath, false);
      } catch (error) {
        console.warn('Error loading database file, falling back to in-memory database:', error);
        return this.initializeInMemory();
      }
    }
    return this.instance;
  }

  /**
   * Initialize an in-memory SQLite database for testing.
   * This is used for tests that need an empty database.
   */
  static async initializeInMemory(): Promise<TestDatabaseService> {
    // Reset any existing instance
    this.resetInstance();

    try {
      const BetterSQLite = require('better-sqlite3');
      const db = new BetterSQLite(':memory:');

      // Create a new instance (schema will be initialized separately)
      this.instance = new TestDatabaseService(db);
      return this.instance;
    } catch (error) {
      console.error('Error initializing in-memory test database:', error);
      throw error;
    }
  }

  /**
   * Initialize a SQLite database from an existing file.
   * @param dbPath Path to the SQLite database file.
   * @param readOnly Whether to open the database in read-only mode.
   */
  static async initializeFromFile(dbPath: string, readOnly = false): Promise<TestDatabaseService> {
    // Reset any existing instance
    this.resetInstance();

    try {
      const BetterSQLite = require('better-sqlite3');
      const db = new BetterSQLite(dbPath, { readonly: readOnly });

      this.instance = new TestDatabaseService(db);
      return this.instance;
    } catch (error) {
      console.error(`Error initializing database from file ${dbPath}:`, error);
      throw error;
    }
  }

  /**
   * Reset the singleton instance. Useful for testing.
   */
  static resetInstance(): void {
    if (this.instance) {
      try {
        this.instance.db.close();
      } catch (e) {
        console.error('Error closing database:', e);
      }
      this.instance = null;
    }
  }

  /**
   * Initialize database schema from SQL statements
   * @param sql SQL statements to execute for schema initialization
   */
  async initializeSchema(sql: string): Promise<void> {
    try {
      this.db.exec(sql);
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  /**
   * Method to load test data - useful for tests
   * @param sqlStatements SQL statements to execute for loading test data
   */
  loadTestData(sqlStatements: string): void {
    this.db.exec(sqlStatements);
  }

  /**
   * Execute multiple SQL statements in a transaction
   * @param statements Array of SQL statements to execute
   * @returns Array of database responses, one for each statement
   */
  async executeTransaction(statements: SqlStatement[]): Promise<DatabaseResponse[]> {
    const results: DatabaseResponse[] = [];

    try {
      // Start a transaction
      this.db.exec('BEGIN TRANSACTION;');

      for (const statement of statements) {
        const result = await this.executeQuery(statement.sql, statement.params);
        results.push(result);
      }

      // Commit the transaction
      this.db.exec('COMMIT;');

      return results;
    } catch (error) {
      // Rollback on error
      this.db.exec('ROLLBACK;');
      console.error('Error executing transaction:', error);
      throw error;
    }
  }

  /**
   * Execute a single SQL query
   * @param sql SQL query to execute
   * @param params Optional parameters for the query
   * @returns Database response
   */
  async executeQuery(sql: string, params: any[] = []): Promise<DatabaseResponse> {
    try {
      const stmt = this.db.prepare(sql);

      // Handle different query types
      if (sql.trim().toLowerCase().startsWith('select')) {
        // For SELECT queries, return all results
        const rows = stmt.all(...params);
        return {
          results: rows.map(row => ({ data: row })),
          count: rows.length,
        };
      } else {
        // For INSERT, UPDATE, DELETE, etc.
        const result = stmt.run(...params);
        return {
          results: [{
            changes: result.changes,
            lastInsertId: result.lastInsertRowid,
          }],
          count: 1,
        };
      }
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
}
