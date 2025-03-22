import {
  Aircraft,
  Mission,
  FuelState,
  FuelMacQuant,
  createAircraft,
  createMission,
  createFuelState,
  getFuelStateByMissionId,
  updateFuelState,
  createFuelMacQuant,
  getAllFuelMacQuants,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('Fuel Operations', () => {
  let missionId: number;

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
      name: 'Fuel Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 5000,
      total_mac_percent: 30,
      aircraft_id: aircraftId,
    };

    const missionResult = await createMission(mission);
    missionId = missionResult.results[0].lastInsertId as number;
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  describe('FuelState Operations', () => {
    it('should create and retrieve a fuel state', async () => {
      // Create test fuel state
      const fuelState: FuelState = {
        mission_id: missionId,
        total_fuel: 10000,
        main_tank_1_fuel: 3000,
        main_tank_2_fuel: 3000,
        main_tank_3_fuel: 2000,
        main_tank_4_fuel: 2000,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 8.5,
      };

      const createResult = await createFuelState(fuelState);
      expect(createResult.results[0].lastInsertId).toBeTruthy();

      // Get fuel state by mission ID
      const getResult = await getFuelStateByMissionId(missionId);
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.total_fuel).toBe(10000);
      expect(getResult.results[0].data?.mac_contribution).toBe(8.5);
    });

    it('should update fuel state', async () => {
      // Create test fuel state
      const fuelState: FuelState = {
        mission_id: missionId,
        total_fuel: 10000,
        main_tank_1_fuel: 3000,
        main_tank_2_fuel: 3000,
        main_tank_3_fuel: 2000,
        main_tank_4_fuel: 2000,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 8.5,
      };

      const createResult = await createFuelState(fuelState);
      const fuelStateId = createResult.results[0].lastInsertId as number;

      // Update fuel state
      const updatedFuelState: FuelState = {
        id: fuelStateId,
        mission_id: missionId,
        total_fuel: 12000,
        main_tank_1_fuel: 3500,
        main_tank_2_fuel: 3500,
        main_tank_3_fuel: 2500,
        main_tank_4_fuel: 2500,
        external_1_fuel: 0,
        external_2_fuel: 0,
        mac_contribution: 9.2,
      };

      await updateFuelState(updatedFuelState);

      // Verify update
      const getResult = await getFuelStateByMissionId(missionId);
      expect(getResult.results[0].data?.total_fuel).toBe(12000);
      expect(getResult.results[0].data?.main_tank_1_fuel).toBe(3500);
      expect(getResult.results[0].data?.mac_contribution).toBe(9.2);
    });
  });

  describe('FuelMacQuant Operations', () => {
    it('should create and retrieve fuel MAC quantities', async () => {
      // Create fuel MAC quantity
      const fuelMacQuant: FuelMacQuant = {
        main_tank_1_fuel: 1000,
        main_tank_2_fuel: 1000,
        main_tank_3_fuel: 1000,
        main_tank_4_fuel: 1000,
        external_1_fuel: 500,
        external_2_fuel: 500,
        mac_contribution: 7.2,
      };

      await createFuelMacQuant(fuelMacQuant);

      // Get all fuel MAC quantities
      const getResult = await getAllFuelMacQuants();
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.mac_contribution).toBe(7.2);
      expect(getResult.results[0].data?.main_tank_1_fuel).toBe(1000);
    });
  });
});
