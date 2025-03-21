import { DatabaseInterface } from './DatabaseService';
import { DatabaseResponse, SqlStatement } from './DatabaseTypes';

/**
 * Implementation of DatabaseInterface for test environments using better-sqlite3.
 * This class is only used in Jest test environments.
 */
export class TestDatabaseService implements DatabaseInterface {
  private static instance: TestDatabaseService | null = null;
  private db: any; // We'll use any type here to avoid importing better-sqlite3 in production code

  private constructor(database: any) {
    this.db = database;
  }

  /**
   * Initialize an in-memory SQLite database for testing.
   * Creates a singleton instance to be reused across tests.
   */
  static async initialize(): Promise<TestDatabaseService> {
    if (!this.instance) {
      try {
        // Use require instead of dynamic import to avoid ESM issues in Jest

        const BetterSQLite = require('better-sqlite3');
        const db = new BetterSQLite(':memory:');

        // Create a new instance (schema will be initialized separately)
        this.instance = new TestDatabaseService(db);
      } catch (error) {
        console.error('Error initializing test database:', error);
        throw error;
      }
    }
    return this.instance;
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
