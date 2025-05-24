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
      front_crew_weight: 400,
      back_crew_weight: 400,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      outboard_fuel: 1000,
      inboard_fuel: 2000,
      fuselage_fuel: 1500,
      auxiliary_fuel: 500,
      external_fuel: 800,
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
    // Create test cargo item with minimal fields
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

    // Check that default values from cargo type were applied
    expect(getResult.results[0].data?.weight).toBe(1000); // default_weight from cargo type
    expect(getResult.results[0].data?.length).toBe(2);    // default_length from cargo type
    expect(getResult.results[0].data?.width).toBe(1.5);   // default_width from cargo type
    expect(getResult.results[0].data?.height).toBe(1);    // default_height from cargo type
    expect(getResult.results[0].data?.forward_overhang).toBe(0.1); // default_forward_overhang from cargo type
    expect(getResult.results[0].data?.back_overhang).toBe(0.1);    // default_back_overhang from cargo type

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
    // Create test cargo item with minimal fields
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Update Item',
      x_start_position: 10,
      y_start_position: 5,
    };

    const createResult = await createCargoItem(cargoItem);
    const cargoItemId = createResult.results[0].lastInsertId as number;

    // Update cargo item with custom values
    const updatedCargoItem: CargoItem = {
      id: cargoItemId,
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Updated Item',
      weight: 1200,
      length: 2.5,
      width: 1.8,
      height: 1.2,
      forward_overhang: 0.2,
      back_overhang: 0.2,
      x_start_position: 15,
      y_start_position: 10,
    };

    await updateCargoItem(updatedCargoItem);

    // Verify update
    const getResult = await getCargoItemById(cargoItemId);
    expect(getResult.results[0].data?.name).toBe('Updated Item');
    expect(getResult.results[0].data?.weight).toBe(1200);
    expect(getResult.results[0].data?.length).toBe(2.5);
    expect(getResult.results[0].data?.width).toBe(1.8);
    expect(getResult.results[0].data?.height).toBe(1.2);
    expect(getResult.results[0].data?.forward_overhang).toBe(0.2);
    expect(getResult.results[0].data?.back_overhang).toBe(0.2);
    expect(getResult.results[0].data?.x_start_position).toBe(15);
    expect(getResult.results[0].data?.y_start_position).toBe(10);
  });

  it('should delete cargo item', async () => {
    // Create test cargo item with minimal fields
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

  it('should create cargo item with custom values that override defaults', async () => {
    // Create test cargo item with custom values
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Custom Item',
      weight: 1500,
      length: 3,
      width: 2,
      height: 1.5,
      forward_overhang: 0.3,
      back_overhang: 0.3,
      x_start_position: 20,
      y_start_position: 10,
    };

    const createResult = await createCargoItem(cargoItem);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const cargoItemId = createResult.results[0].lastInsertId;

    // Get cargo item by ID
    const getResult = await getCargoItemById(cargoItemId as number);
    expect(getResult.count).toBe(1);

    // Check that custom values were used instead of defaults
    expect(getResult.results[0].data?.weight).toBe(1500);
    expect(getResult.results[0].data?.length).toBe(3);
    expect(getResult.results[0].data?.width).toBe(2);
    expect(getResult.results[0].data?.height).toBe(1.5);
    expect(getResult.results[0].data?.forward_overhang).toBe(0.3);
    expect(getResult.results[0].data?.back_overhang).toBe(0.3);
    expect(getResult.results[0].data?.x_start_position).toBe(20);
    expect(getResult.results[0].data?.y_start_position).toBe(10);
  });
});
