/**
 * @jest-environment node
 * @jest-environment-options {"skipTests": true}
 *
 * Common test utilities for database operation tests
 * This file is NOT a test file and should NOT be executed by Jest
 */

import { DatabaseFactory, initializeLoadmasterDatabase } from '../../../src/services/db';
import { TestDatabaseService } from '../../../src/services/db/TestDatabaseService';

/**
 * Setup test database for database operation tests
 */
export async function setupTestDatabase(): Promise<TestDatabaseService> {
  // Explicitly reset the database instance before initializing a new one
  DatabaseFactory.resetInstance();
  TestDatabaseService.resetInstance();

  // Initialize a new in-memory database
  const testDb = await TestDatabaseService.initialize(true) as TestDatabaseService;
  await initializeLoadmasterDatabase(testDb);
  jest.spyOn(DatabaseFactory, 'getDatabase').mockResolvedValue(testDb);

  return testDb;
}

/**
 * Clean up test database after tests
 */
export function cleanupTestDatabase(): void {
  jest.restoreAllMocks();
}
