/**
 * @jest-environment node
 * @jest-environment-options {"skipTests": true}
 */

import { DatabaseInterface } from '../../src/services/DatabaseService';
import { DatabaseResponse, SqlStatement } from '../../src/services/DatabaseTypes';

// Mock functions for testing
export const executeQueryMock = jest.fn();
export const initializeSchemaMock = jest.fn();
export const executeTransactionMock = jest.fn();

// Simple mock implementation of the DatabaseInterface
export class MockDatabaseService implements DatabaseInterface {
  executeQuery(sql: string, params: any[] = []): Promise<DatabaseResponse> {
    return executeQueryMock(sql, params);
  }

  initializeSchema(sql: string): Promise<void> {
    return initializeSchemaMock(sql);
  }

  executeTransaction(statements: SqlStatement[]): Promise<DatabaseResponse[]> {
    return executeTransactionMock(statements);
  }

  // Add a testing utility method
  resetMocks(): void {
    executeQueryMock.mockReset();
    initializeSchemaMock.mockReset();
    executeTransactionMock.mockReset();
  }
}

// Create singleton instance for tests
export const mockDatabaseService = new MockDatabaseService();
