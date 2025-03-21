# Database Testing in LoadMaster

This document explains how we've implemented SQLite database testing in the LoadMaster application.

## Architecture

We've refactored the database service to enable testing with both the React Native SQLite implementation (for production) and better-sqlite3 (for unit tests). The architecture consists of:

1. **DatabaseInterface** - A common interface that defines all database operations
2. **NativeDatabaseService** - The production implementation using react-native-sqlite-storage
3. **TestDatabaseService** - The testing implementation using better-sqlite3
4. **DatabaseFactory** - A factory that returns the appropriate implementation based on the environment

## Testing Approach

We can now write Jest tests that interact with a real SQLite database (in-memory), allowing us to:

- Test database queries in isolation
- Create fixtures with test data
- Verify database operations (insert, update, delete, select)
- Validate business logic that depends on database operations

## Test Compatibility

This implementation supports two different styles of tests:

1. **Legacy Tests** (`__tests__/services/DatabaseService.test.ts`) - These tests use mocked SQLite functions and expect certain calls.
2. **Integration Tests** (`__tests__/services/DatabaseIntegrationTests.test.ts`) - These tests use better-sqlite3 and test actual database operations.

Both types of tests are organized in the `__tests__` directory following project conventions.

## Setup Instructions

### Dependencies

- **better-sqlite3** - For in-memory SQLite database in tests
- **jest-fetch-mock** - For mocking fetch in tests
- **@types/node** - For Node.js type definitions (process.env)

### Running Tests

```bash
# Run all tests (all should pass now)
npm test

# Run only the integration database tests
npm test -- --testPathPattern=DatabaseIntegrationTests

# Run only the legacy database tests
npm test -- --testPathPattern=__tests__/services/DatabaseService.test.ts
```

### Creating Database Tests

1. Use the DatabaseFactory to get an instance of the database:

```typescript
const dbService = await DatabaseFactory.getDatabase();
```

2. Load test data if needed:

```typescript
if (process.env.NODE_ENV === 'test') {
  const testDb = dbService as TestDatabaseService;
  testDb.loadTestData(`
    INSERT INTO my_table (id, name) VALUES (1, 'test');
  `);
}
```

3. Test database operations using the common interface:

```typescript
const result = await dbService.executeQuery('SELECT * FROM my_table WHERE id = ?', [1]);
expect(result.length).toBe(1);
expect(result[0].name).toBe('test');
```

## How It Works

- In production, the app uses react-native-sqlite-storage with platform-specific initialization
- In tests, we use better-sqlite3 with an in-memory database
- The common interface ensures all operations behave consistently in both environments
- Jest configuration is set up to handle the necessary mocking and module transformation
- A custom mock implementation ensures compatibility with legacy tests

## Special Considerations for New Tests

For new tests that use better-sqlite3, add this at the top of your test file:

```typescript
// Force unmock of modules we need for testing with better-sqlite3
jest.unmock('@/services/DatabaseService');
jest.unmock('better-sqlite3');
jest.unmock('@/services/TestDatabaseService');

// Then import your modules
import { DatabaseFactory, DatabaseInterface } from '@/services/DatabaseService';
import { TestDatabaseService } from '@/services/TestDatabaseService'; 
```

## Testing Configuration Files

Our test setup involves several configuration files:

1. **jest.config.js** - Base Jest configuration with module mapping
2. **jest.setup.js** - Global test setup and mocks
3. **jest.resolver.js** - Custom module resolution for better-sqlite3
4. **src/services/__mocks__/DatabaseService.ts** - Mock implementation for legacy tests

## Extending the System

To add new database operations:

1. Add the method to the DatabaseInterface
2. Implement the method in both NativeDatabaseService and TestDatabaseService
3. Write tests for the new functionality
4. Update the mock implementation in __mocks__ if needed for legacy tests

## Future Improvements

- Add schema management for test database initialization
- Create test utilities for common database testing tasks
- Add transaction support to the interface
- Convert legacy tests to use the new interface over time 