g# Database Testing Approach

This document outlines the approach for testing database operations in the LoadMaster application.

## Architecture

The database layer is built using a clean interface-based approach:

1. **DatabaseInterface**: The core contract that all database implementations must follow
2. **DatabaseFactory**: A factory class that provides access to the right database implementation
3. **Concrete Implementations**:
   - **NativeDatabaseService**: For production, using `react-native-sqlite-storage`
   - **TestDatabaseService**: For testing, using `better-sqlite3`

> **Note:** The legacy database API has been removed in favor of this clean interface-based approach. All code should now use the `DatabaseFactory.getDatabase()` method to access database functionality.

## Testing Strategy

We use three types of tests for the database layer:

### 1. Mock Tests

These tests don't use a real database but instead mock the `DatabaseInterface` methods. They're fast and focus on testing the correct invocation of database methods.

- Location: `__tests__/services/DatabaseServiceMock.test.ts`
- Purpose: Test that database methods are called with correct parameters
- Dependencies: Jest mocks

Example:

```typescript
// Setup mock response
const mockResponse = {
  results: [{ data: { id: 1, name: 'Test' } }],
  count: 1
};
mockExecuteQuery.mockResolvedValue(mockResponse);

// Execute the actual method
const result = await dbService.executeQuery('SELECT * FROM items WHERE id = ?', [1]);

// Verify mock was called correctly
expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?', [1]);
```

### 2. Factory Tests

These tests ensure the `DatabaseFactory` provides the correct implementation based on the environment.

- Location: `__tests__/services/DatabaseFactoryTests.test.ts`
- Purpose: Test that the factory returns the right implementation and maintains singleton instances

### 3. Integration Tests

These tests use an actual in-memory SQLite database to verify real SQL operations work correctly.

- Location: `__tests__/services/DatabaseIntegrationTests.test.ts`
- Purpose: Test actual SQL execution with a real database
- Dependencies: `better-sqlite3` (dev dependency)

Example:

```typescript
// Initialize database and schema
dbService = await DatabaseFactory.getDatabase();
await dbService.initializeSchema(TEST_SCHEMA);

// Perform an actual query
const response = await dbService.executeQuery('SELECT * FROM test_table WHERE id = ?', [1]);

// Verify results
expect(response.count).toBe(1);
expect(response.results[0].data?.name).toBe('item1');
```

## Running Tests

To run all tests:

```bash
npm test
```

To run database tests specifically:

```bash
npm test -- --testPathPattern=services
```

## Adding New Tests

When adding new database functionality:

1. Start by writing mock tests to verify method calls
2. Then add integration tests to verify SQL behavior
3. Ensure both implementations (`NativeDatabaseService` and `TestDatabaseService`) support the new functionality

## Best Practices

1. Always use parameterized queries to prevent SQL injection
2. Use transactions for operations that modify multiple tables
3. Follow the `DatabaseInterface` contract for all database operations
4. Add integration tests for complex SQL queries
5. Use mocks for testing components that depend on the database 