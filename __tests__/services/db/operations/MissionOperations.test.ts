import {
  Aircraft,
  Mission,
  createAircraft,
  createMission,
  getMissionById,
  getAllMissions,
  getMissionsByAircraftId,
  updateMission,
  deleteMission,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('Mission Operations', () => {
  let aircraftId: number;

  beforeEach(async () => {
    await setupTestDatabase();

    // Create an aircraft for mission tests
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

    const createResult = await createAircraft(aircraft);
    aircraftId = createResult.results[0].lastInsertId as number;
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  it('should create and retrieve a mission', async () => {
    // Create test mission
    const mission: Mission = {
      name: 'Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      crew_weight: 800,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      aircraft_id: aircraftId,
    };

    const createResult = await createMission(mission);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const missionId = createResult.results[0].lastInsertId;

    // Get mission by ID
    const getResult = await getMissionById(missionId as number);
    expect(getResult.count).toBe(1);
    expect(getResult.results[0].data?.name).toBe('Test Mission');
    expect(getResult.results[0].data?.aircraft_id).toBe(aircraftId);
  });

  it('should retrieve all missions', async () => {
    // Create multiple missions
    const mission1: Mission = {
      name: 'Mission 1',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      crew_weight: 800,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      aircraft_id: aircraftId,
    };

    const mission2: Mission = {
      name: 'Mission 2',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 6000,
      total_mac_percent: 32,
      crew_weight: 850,
      configuration_weights: 175,
      crew_gear_weight: 225,
      food_weight: 125,
      safety_gear_weight: 60,
      etc_weight: 90,
      aircraft_id: aircraftId,
    };

    await createMission(mission1);
    await createMission(mission2);

    // Get all missions
    const getResult = await getAllMissions();
    expect(getResult.count).toBe(2);
  });

  it('should retrieve missions by aircraft id', async () => {
    // Create multiple missions for the same aircraft
    const mission1: Mission = {
      name: 'Mission 1',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      crew_weight: 800,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      aircraft_id: aircraftId,
    };

    const mission2: Mission = {
      name: 'Mission 2',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 6000,
      total_mac_percent: 32,
      crew_weight: 850,
      configuration_weights: 175,
      crew_gear_weight: 225,
      food_weight: 125,
      safety_gear_weight: 60,
      etc_weight: 90,
      aircraft_id: aircraftId,
    };

    await createMission(mission1);
    await createMission(mission2);

    // Get missions by aircraft ID
    const getResult = await getMissionsByAircraftId(aircraftId);
    expect(getResult.count).toBe(2);
  });

  it('should update mission', async () => {
    // Create a mission
    const mission: Mission = {
      name: 'Update Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      crew_weight: 800,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      aircraft_id: aircraftId,
    };

    const createResult = await createMission(mission);
    const missionId = createResult.results[0].lastInsertId as number;

    // Update mission
    const updatedMission: Mission = {
      id: missionId,
      name: 'Updated Mission',
      created_date: mission.created_date,
      modified_date: new Date().toISOString(),
      total_weight: 5500,
      total_mac_percent: 32,
      crew_weight: 850,
      configuration_weights: 175,
      crew_gear_weight: 225,
      food_weight: 125,
      safety_gear_weight: 60,
      etc_weight: 90,
      aircraft_id: aircraftId,
    };

    await updateMission(updatedMission);

    // Verify update
    const getResult = await getMissionById(missionId);
    expect(getResult.results[0].data?.name).toBe('Updated Mission');
    expect(getResult.results[0].data?.total_weight).toBe(5500);
  });

  it('should delete mission', async () => {
    // Create a mission
    const mission: Mission = {
      name: 'Delete Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      crew_weight: 800,
      configuration_weights: 150,
      crew_gear_weight: 200,
      food_weight: 100,
      safety_gear_weight: 50,
      etc_weight: 75,
      aircraft_id: aircraftId,
    };

    const createResult = await createMission(mission);
    const missionId = createResult.results[0].lastInsertId as number;

    // Delete mission
    await deleteMission(missionId);

    // Verify deletion
    const getResult = await getMissionById(missionId);
    expect(getResult.count).toBe(0);
  });
});
