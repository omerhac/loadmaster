import {
  calculateMACPercent,
  calculateMACIndex,
  calculateAircraftCG,
  calculateTotalAircraftWeight,
  calculateFuelMAC,
  getEmptyAircraftMACIndex,
} from '../../../src/services/mac';

import { setupTestDatabase, cleanupTestDatabase } from '../db/testHelpers';
import {
  Aircraft,
  Mission,
  CargoType,
  CargoItem,
  createAircraft,
  createMission,
  createCargoType,
  createCargoItem,
} from '../../../src/services/db/operations';

describe('MAC Calculation Service', () => {
  // Test data IDs
  let aircraftId: number;
  let missionId: number;
  let cargoTypeId: number;
  let cargoItemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Create test aircraft
    const aircraft: Aircraft = {
      type: 'C-130',
      name: 'Test Aircraft',
      empty_weight: 83288,
      empty_mac: 84.3,
      cargo_bay_width: 10,
      treadways_width: 2,
      treadways_dist_from_center: 1,
      ramp_length: 10,
      ramp_max_incline: 15,
      ramp_min_incline: 5,
    };
    const aircraftResult = await createAircraft(aircraft);
    aircraftId = aircraftResult.results[0].lastInsertId as number;

    // Create test mission
    const mission: Mission = {
      name: 'Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      loadmasters: 6,
      loadmasters_fs: 239.34,
      configuration_weights: 0,
      crew_gear_weight: 0,
      food_weight: 0,
      safety_gear_weight: 250,
      etc_weight: 637,
      outboard_fuel: 16000,
      inboard_fuel: 15000,
      fuselage_fuel: 0,
      auxiliary_fuel: 4000,
      external_fuel: 0,
      aircraft_id: aircraftId,
    };
    const missionResult = await createMission(mission);
    missionId = missionResult.results[0].lastInsertId as number;

    // Create test cargo type
    const cargoType: CargoType = {
      name: 'Test Cargo Type',
      default_weight: 2000,
      default_length: 5,
      default_width: 3,
      default_height: 2,
      default_forward_overhang: 0.5,
      default_back_overhang: 0.5,
      type: 'bulk',
    };
    const cargoTypeResult = await createCargoType(cargoType);
    cargoTypeId = cargoTypeResult.results[0].lastInsertId as number;

    // Create test cargo item
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Test Cargo Item',
      weight: 20000,
      length: 5,
      width: 3,
      height: 2,
      forward_overhang: 0.5,
      back_overhang: 0.5,
      x_start_position: 527.5,
      y_start_position: 2,
      status: 'onDeck',
    };
    const cargoItemResult = await createCargoItem(cargoItem);
    cargoItemId = cargoItemResult.results[0].lastInsertId as number;

    // Note: Fuel MAC is now calculated directly using formulas instead of table lookup
  });

  describe('calculateMACIndex', () => {
    it('should calculate the MAC index for a cargo item', async () => {
      const macIndex = await calculateMACIndex(cargoItemId);

      // The expected value is based on the formula:
      // (centerX - 533.46) * weight / 50000
      // centerX = x_start_position + (length / 2) = 527.5 + (5 / 2) = 530
      // index = (530 - 533.46) * 20000 / 50000 = -1.384

      expect(macIndex).toBeCloseTo(-1.384, 2);
    });

    it('should throw an error for non-existent cargo item', async () => {
      await expect(calculateMACIndex(99999)).rejects.toThrow('Cargo item with ID 99999 not found');
    });
  });

  describe('calculateTotalAircraftWeight', () => {
    it('should calculate the total aircraft weight', async () => {
      const totalWeight = await calculateTotalAircraftWeight(missionId);

      // this matches the total weight in the yom imon mahad excel

      expect(totalWeight).toBeCloseTo(139195, 1);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateTotalAircraftWeight(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateFuelMAC', () => {
    it('should calculate the MAC contribution from fuel', async () => {
      const fuelMAC = await calculateFuelMAC(missionId);


      expect(fuelMAC).toBeCloseTo(11.738, 2);
    });

    it('should return 0 for mission with no fuel state', async () => {
      // Create a mission with no fuel
      const mission: Mission = {
        name: 'No Fuel Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        loadmasters: 2,
        loadmasters_fs: 500,
        configuration_weights: 500,
        crew_gear_weight: 300,
        food_weight: 200,
        safety_gear_weight: 150,
        etc_weight: 100,
        outboard_fuel: 0,
        inboard_fuel: 0,
        fuselage_fuel: 0,
        auxiliary_fuel: 0,
        external_fuel: 0,
        aircraft_id: aircraftId,
      };
      const missionResult = await createMission(mission);
      const noFuelMissionId = missionResult.results[0].lastInsertId as number;

      const fuelMAC = await calculateFuelMAC(noFuelMissionId);
      expect(fuelMAC).toBe(0);
    });
  });

  describe('calculateAircraftCG', () => {
    it('should calculate the aircraft center of gravity', async () => {
      // For this test we'll use a fixed total index value
      const totalIndex = 5;
      const cg = await calculateAircraftCG(missionId, totalIndex);

      // Calculate the expected CG using the formula:
      // CG = (totalIndex - 100) * 50000 / totalWeight + 533.46

      // We need to calculate totalWeight first
      const totalWeight = await calculateTotalAircraftWeight(missionId);

      // Now apply the formula
      const expectedCG = (totalIndex - 100) * 50000 / totalWeight + 533.46;

      expect(cg).toBeCloseTo(expectedCG, 2);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateAircraftCG(99999, 5)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('getEmptyAircraftMACIndex', () => {
    it('should retrieve the empty MAC index of an aircraft', async () => {
      const emptyMacIndex = await getEmptyAircraftMACIndex(aircraftId);

      expect(emptyMacIndex).toBe(84.3);
    });

    it('should throw an error for non-existent aircraft', async () => {
      await expect(getEmptyAircraftMACIndex(99999)).rejects.toThrow('Aircraft with ID 99999 not found');
    });
  });

  describe('calculateMACPercent', () => {
    it('should calculate the MAC percentage for a mission', async () => {
      const macPercent = await calculateMACPercent(missionId);
      // this matches yom imon mahad excel
      expect(macPercent).toBeCloseTo(25.87, 1);

      // Also verify it's a valid number
      expect(macPercent).toBeDefined();
      expect(typeof macPercent).toBe('number');
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateMACPercent(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });
});
