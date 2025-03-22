import {
  Aircraft,
  Mission,
  CargoType,
  CargoItem,
  createAircraft,
  createMission,
  createCargoType,
  createCargoItem,
  getCargoItemById,
  getCargoItemsByMissionId,
  updateCargoItem,
  deleteCargoItem,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('CargoItem Operations', () => {
  let missionId: number;
  let cargoTypeId: number;

  beforeEach(async () => {
    await setupTestDatabase();

    // Create an aircraft
    const aircraft: Aircraft = {
      type: 'Test',
      name: 'Aircraft',
      empty_weight: 10000,
      empty_mac: 15,
      cargo_bay_width: 5,
      treadways_width: 1,
      treadways_dist_from_center: 0.5,
      ramp_length: 2,
      ramp_max_incline: 10,
      ramp_min_incline: 3,
    };

    const aircraftResult = await createAircraft(aircraft);
    const aircraftId = aircraftResult.results[0].lastInsertId as number;

    // Create a mission
    const mission: Mission = {
      name: 'Cargo Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      aircraft_id: aircraftId,
    };

    const missionResult = await createMission(mission);
    missionId = missionResult.results[0].lastInsertId as number;

    // Create a cargo type
    const cargoType: CargoType = {
      name: 'Test Item Type',
      default_weight: 1000,
      default_length: 2,
      default_width: 1.5,
      default_height: 1,
      default_forward_overhang: 0.1,
      default_back_overhang: 0.1,
      type: 'bulk',
    };

    const cargoTypeResult = await createCargoType(cargoType);
    cargoTypeId = cargoTypeResult.results[0].lastInsertId as number;
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  it('should create and retrieve a cargo item', async () => {
    // Create test cargo item
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Test Item',
      x_start_position: 10,
      y_start_position: 5,
    };

    const createResult = await createCargoItem(cargoItem);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const cargoItemId = createResult.results[0].lastInsertId;

    // Get cargo item by ID
    const getResult = await getCargoItemById(cargoItemId as number);
    expect(getResult.count).toBe(1);
    expect(getResult.results[0].data?.name).toBe('Test Item');
    expect(getResult.results[0].data?.x_start_position).toBe(10);
    expect(getResult.results[0].data?.y_start_position).toBe(5);
  });

  it('should retrieve cargo items by mission ID', async () => {
    // Create multiple cargo items
    const cargoItem1: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Item 1',
      x_start_position: 10,
      y_start_position: 5,
    };

    const cargoItem2: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Item 2',
      x_start_position: 15,
      y_start_position: 5,
    };

    await createCargoItem(cargoItem1);
    await createCargoItem(cargoItem2);

    // Get cargo items by mission ID
    const getResult = await getCargoItemsByMissionId(missionId);
    expect(getResult.count).toBe(2);
  });

  it('should update cargo item', async () => {
    // Create test cargo item
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Update Item',
      x_start_position: 10,
      y_start_position: 5,
    };

    const createResult = await createCargoItem(cargoItem);
    const cargoItemId = createResult.results[0].lastInsertId as number;

    // Update cargo item
    const updatedCargoItem: CargoItem = {
      id: cargoItemId,
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Updated Item',
      x_start_position: 15,
      y_start_position: 10,
    };

    await updateCargoItem(updatedCargoItem);

    // Verify update
    const getResult = await getCargoItemById(cargoItemId);
    expect(getResult.results[0].data?.name).toBe('Updated Item');
    expect(getResult.results[0].data?.x_start_position).toBe(15);
    expect(getResult.results[0].data?.y_start_position).toBe(10);
  });

  it('should delete cargo item', async () => {
    // Create test cargo item
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Delete Item',
      x_start_position: 10,
      y_start_position: 5,
    };

    const createResult = await createCargoItem(cargoItem);
    const cargoItemId = createResult.results[0].lastInsertId as number;

    // Delete cargo item
    await deleteCargoItem(cargoItemId);

    // Verify deletion
    const getResult = await getCargoItemById(cargoItemId);
    expect(getResult.count).toBe(0);
  });
});
