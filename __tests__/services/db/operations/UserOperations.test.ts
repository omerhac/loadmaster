import { User, createUser, getUserById, getUserByUsername, updateUser, deleteUser } from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('User Operations', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  it('should create and retrieve a user', async () => {
    // Create test user
    const user: User = {
      username: 'testuser',
      last_login: new Date().toISOString(),
    };

    const createResult = await createUser(user);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const userId = createResult.results[0].lastInsertId;

    // Get user by ID
    const getResult = await getUserById(userId as number);
    expect(getResult.count).toBe(1);
    expect(getResult.results[0].data?.username).toBe('testuser');
  });

  it('should get user by username', async () => {
    // Create test user
    const user: User = {
      username: 'findbyusername',
      last_login: new Date().toISOString(),
    };

    await createUser(user);

    // Get by username
    const result = await getUserByUsername('findbyusername');
    expect(result.count).toBe(1);
    expect(result.results[0].data?.username).toBe('findbyusername');
  });

  it('should update user', async () => {
    // Create test user
    const user: User = {
      username: 'updateme',
      last_login: new Date().toISOString(),
    };

    const createResult = await createUser(user);
    const userId = createResult.results[0].lastInsertId;

    // Update user
    const userToUpdate: User = {
      id: userId as number,
      username: 'updated',
      last_login: new Date().toISOString(),
    };

    await updateUser(userToUpdate);

    // Verify update
    const getResult = await getUserById(userId as number);
    expect(getResult.results[0].data?.username).toBe('updated');
  });

  it('should delete user', async () => {
    // Create test user
    const user: User = {
      username: 'deleteme',
      last_login: new Date().toISOString(),
    };

    const createResult = await createUser(user);
    const userId = createResult.results[0].lastInsertId;

    // Delete user
    await deleteUser(userId as number);

    // Verify deletion
    const getResult = await getUserById(userId as number);
    expect(getResult.count).toBe(0);
  });
});
