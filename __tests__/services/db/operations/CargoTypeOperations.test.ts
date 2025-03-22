import {
  CargoType,
  createCargoType,
  getCargoTypeById,
  getAllCargoTypes,
  getCargoTypesByUserId,
  updateCargoType,
  deleteCargoType,
  User,
  createUser,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('CargoType Operations', () => {
  let userId: number;

  beforeEach(async () => {
    await setupTestDatabase();

    // Create a user for cargo type tests that need user association
    const user: User = {
      username: 'cargouser',
      last_login: new Date().toISOString(),
    };

    const createResult = await createUser(user);
    userId = createResult.results[0].lastInsertId as number;
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  it('should create and retrieve a cargo type', async () => {
    // Create test cargo type
    const cargoType: CargoType = {
      name: 'Test Cargo',
      default_weight: 1000,
      default_length: 2,
      default_width: 1.5,
      default_height: 1,
      default_forward_overhang: 0.1,
      default_back_overhang: 0.1,
      type: 'bulk',
    };

    const createResult = await createCargoType(cargoType);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const cargoTypeId = createResult.results[0].lastInsertId;

    // Get cargo type by ID
    const getResult = await getCargoTypeById(cargoTypeId as number);
    expect(getResult.count).toBe(1);
    expect(getResult.results[0].data?.name).toBe('Test Cargo');
    expect(getResult.results[0].data?.default_weight).toBe(1000);
  });

  it('should retrieve all cargo types', async () => {
    // Create multiple cargo types
    const cargoType1: CargoType = {
      name: 'Type 1',
      default_weight: 1000,
      default_length: 2,
      default_width: 1.5,
      default_height: 1,
      default_forward_overhang: 0.1,
      default_back_overhang: 0.1,
      type: 'bulk',
    };

    const cargoType2: CargoType = {
      name: 'Type 2',
      default_weight: 2000,
      default_length: 3,
      default_width: 2,
      default_height: 1.5,
      default_forward_overhang: 0.2,
      default_back_overhang: 0.2,
      type: '4_wheeled',
    };

    await createCargoType(cargoType1);
    await createCargoType(cargoType2);

    // Get all cargo types
    const getResult = await getAllCargoTypes();
    expect(getResult.count).toBe(2);
  });

  it('should retrieve cargo types by user ID', async () => {
    // Create cargo types associated with user
    const cargoType1: CargoType = {
      user_id: userId,
      name: 'User Type 1',
      default_weight: 1000,
      default_length: 2,
      default_width: 1.5,
      default_height: 1,
      default_forward_overhang: 0.1,
      default_back_overhang: 0.1,
      type: 'bulk',
    };

    const cargoType2: CargoType = {
      user_id: userId,
      name: 'User Type 2',
      default_weight: 2000,
      default_length: 3,
      default_width: 2,
      default_height: 1.5,
      default_forward_overhang: 0.2,
      default_back_overhang: 0.2,
      type: '2_wheeled',
    };

    // Create another cargo type not associated with the user
    const cargoType3: CargoType = {
      name: 'No User Type',
      default_weight: 3000,
      default_length: 4,
      default_width: 3,
      default_height: 2,
      default_forward_overhang: 0.3,
      default_back_overhang: 0.3,
      type: '4_wheeled',
    };

    await createCargoType(cargoType1);
    await createCargoType(cargoType2);
    await createCargoType(cargoType3);

    // Get cargo types by user ID
    const getResult = await getCargoTypesByUserId(userId);
    expect(getResult.count).toBe(2);
  });

  it('should update cargo type', async () => {
    // Create test cargo type
    const cargoType: CargoType = {
      name: 'Update Type',
      default_weight: 1000,
      default_length: 2,
      default_width: 1.5,
      default_height: 1,
      default_forward_overhang: 0.1,
      default_back_overhang: 0.1,
      type: 'bulk',
    };

    const createResult = await createCargoType(cargoType);
    const cargoTypeId = createResult.results[0].lastInsertId as number;

    // Update cargo type
    const updatedCargoType: CargoType = {
      id: cargoTypeId,
      name: 'Updated Type',
      default_weight: 1500,
      default_length: 2.5,
      default_width: 2,
      default_height: 1.2,
      default_forward_overhang: 0.15,
      default_back_overhang: 0.15,
      type: '2_wheeled',
    };

    await updateCargoType(updatedCargoType);

    // Verify update
    const getResult = await getCargoTypeById(cargoTypeId);
    expect(getResult.results[0].data?.name).toBe('Updated Type');
    expect(getResult.results[0].data?.default_weight).toBe(1500);
    expect(getResult.results[0].data?.type).toBe('2_wheeled');
  });

  it('should delete cargo type', async () => {
    // Create test cargo type
    const cargoType: CargoType = {
      name: 'Delete Type',
      default_weight: 1000,
      default_length: 2,
      default_width: 1.5,
      default_height: 1,
      default_forward_overhang: 0.1,
      default_back_overhang: 0.1,
      type: 'bulk',
    };

    const createResult = await createCargoType(cargoType);
    const cargoTypeId = createResult.results[0].lastInsertId as number;

    // Delete cargo type
    await deleteCargoType(cargoTypeId);

    // Verify deletion
    const getResult = await getCargoTypeById(cargoTypeId);
    expect(getResult.count).toBe(0);
  });
});
