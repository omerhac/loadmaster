/**
 * Common database types and result formats for the application
 */

/**
 * Database query result format for all database operations
 */
export interface QueryResult {
  /** Row data as an object with column names as keys (for SELECT queries) */
  data?: Record<string, any>;

  /** For non-SELECT queries, the number of rows affected */
  changes?: number;

  /** For INSERT operations, the ID of the last inserted row */
  lastInsertId?: number;
}

/**
 * Standard response format for all database operations
 */
export interface DatabaseResponse {
  /** Array of query results */
  results: QueryResult[];

  /** Total number of rows returned/affected */
  count: number;

  /** Error information if the query failed */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * SQL statement with parameters
 */
export interface SqlStatement {
  /** The SQL query to execute */
  sql: string;

  /** Parameter values to bind to the query */
  params?: any[];
}

/**
 * Type for schema creation statements
 */
export interface SchemaDefinition {
  /** Table name */
  tableName: string;

  /** SQL statement to create the table */
  createStatement: string;
}
