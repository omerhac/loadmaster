import {
  Aircraft,
  createAircraft,
  getAircraftById,
  getAllAircraft,
  updateAircraft,
  deleteAircraft,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';
import { TestDatabaseService } from '../../../../src/services/db/TestDatabaseService';

describe('Aircraft Operations', () => {
  let testDb: TestDatabaseService;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  it('should create and retrieve an aircraft', async () => {
    // Create test aircraft
    const aircraft: Aircraft = {
      type: 'C-130',
      name: 'Hercules',
      empty_weight: 36000,
      empty_mac: 25.5,
      cargo_bay_width: 10.3,
      treadways_width: 2.5,
      treadways_dist_from_center: 1.2,
      ramp_length: 3.5,
      ramp_max_incline: 15,
      ramp_min_incline: 5,
    };

    const createResult = await createAircraft(aircraft);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const aircraftId = createResult.results[0].lastInsertId;

    // Get aircraft by ID
    const getResult = await getAircraftById(aircraftId as number);
    expect(getResult.count).toBe(1);
    expect(getResult.results[0].data?.name).toBe('Hercules');
    expect(getResult.results[0].data?.type).toBe('C-130');
  });

  it('should retrieve all aircraft', async () => {
    // Create multiple aircraft
    const aircraft1: Aircraft = {
      type: 'C-130',
      name: 'Hercules 1',
      empty_weight: 35000,
      empty_mac: 25.5,
      cargo_bay_width: 10.3,
      treadways_width: 2.5,
      treadways_dist_from_center: 1.2,
      ramp_length: 3.5,
      ramp_max_incline: 15,
      ramp_min_incline: 5,
    };

    const aircraft2: Aircraft = {
      type: 'C-17',
      name: 'Globemaster',
      empty_weight: 135000,
      empty_mac: 35.5,
      cargo_bay_width: 18,
      treadways_width: 3.5,
      treadways_dist_from_center: 2.2,
      ramp_length: 6.5,
      ramp_max_incline: 18,
      ramp_min_incline: 8,
    };

    await createAircraft(aircraft1);
    await createAircraft(aircraft2);

    // Get all aircraft
    const getResult = await getAllAircraft();
    expect(getResult.count).toBe(2);
  });

  it('should update aircraft', async () => {
    // Create test aircraft
    const aircraft: Aircraft = {
      type: 'C-5',
      name: 'Galaxy',
      empty_weight: 180000,
      empty_mac: 45.5,
      cargo_bay_width: 19,
      treadways_width: 4,
      treadways_dist_from_center: 3,
      ramp_length: 7.5,
      ramp_max_incline: 12,
      ramp_min_incline: 4,
    };

    const createResult = await createAircraft(aircraft);
    const aircraftId = createResult.results[0].lastInsertId;

    // Update aircraft
    const updatedAircraft: Aircraft = {
      id: aircraftId as number,
      type: 'C-5M',
      name: 'Super Galaxy',
      empty_weight: 185000,
      empty_mac: 46,
      cargo_bay_width: 19,
      treadways_width: 4,
      treadways_dist_from_center: 3,
      ramp_length: 7.5,
      ramp_max_incline: 12,
      ramp_min_incline: 4,
    };

    await updateAircraft(updatedAircraft);

    // Verify update
    const getResult = await getAircraftById(aircraftId as number);
    expect(getResult.results[0].data?.name).toBe('Super Galaxy');
    expect(getResult.results[0].data?.type).toBe('C-5M');
  });

  it('should delete aircraft', async () => {
    // Create test aircraft
    const aircraft: Aircraft = {
      type: 'Delete',
      name: 'This',
      empty_weight: 10000,
      empty_mac: 15,
      cargo_bay_width: 5,
      treadways_width: 1,
      treadways_dist_from_center: 0.5,
      ramp_length: 2,
      ramp_max_incline: 10,
      ramp_min_incline: 3,
    };

    const createResult = await createAircraft(aircraft);
    const aircraftId = createResult.results[0].lastInsertId;

    // Delete aircraft
    await deleteAircraft(aircraftId as number);

    // Verify deletion
    const getResult = await getAircraftById(aircraftId as number);
    expect(getResult.count).toBe(0);
  });
});
