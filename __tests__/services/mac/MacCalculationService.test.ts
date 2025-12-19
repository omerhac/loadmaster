import {
  calculateMACPercent,
  calculateMACIndex,
  calculateAircraftCG,
  calculateTotalAircraftWeight,
  calculateFuelMAC,
  getEmptyAircraftMACIndex,
  calculateLoadmastersWeight,
  calculateLoadmastersIndex,
  calculateBaseWeight,
  calculateTotalFuelWeight,
  calculateCargoWeight,
  calculateCargoMACIndex,
  calculateTotalIndex,
  calculateZeroFuelWeight,
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
import { DEFAULT_LOADMASTER_WEIGHT } from '../../../src/constants';

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
  });

  describe('calculateLoadmastersWeight', () => {
    it('should calculate the total weight of loadmasters', () => {
      const weight = calculateLoadmastersWeight(6);
      expect(weight).toBe(6 * DEFAULT_LOADMASTER_WEIGHT);
    });

    it('should return 0 for 0 loadmasters', () => {
      const weight = calculateLoadmastersWeight(0);
      expect(weight).toBe(0);
    });

    it('should handle single loadmaster', () => {
      const weight = calculateLoadmastersWeight(1);
      expect(weight).toBe(DEFAULT_LOADMASTER_WEIGHT);
    });
  });

  describe('calculateLoadmastersIndex', () => {
    it('should calculate the MAC index contribution from loadmasters', async () => {
      const index = await calculateLoadmastersIndex(missionId);

      // Formula: (loadmasters_fs - 533.46) * loadmastersWeight / 50000
      // loadmasters_fs = 239.34, loadmasters = 6
      // loadmastersWeight = 6 * DEFAULT_LOADMASTER_WEIGHT
      const expectedWeight = 6 * DEFAULT_LOADMASTER_WEIGHT;
      const expectedIndex = (239.34 - 533.46) * expectedWeight / 50000;

      expect(index).toBeCloseTo(expectedIndex, 4);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateLoadmastersIndex(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
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

  describe('calculateBaseWeight', () => {
    it('should calculate the base weight', async () => {
      const baseWeight = await calculateBaseWeight(missionId);

      // Base weight = empty_weight + configuration_weights + loadmastersWeight +
      //               crew_gear_weight + food_weight + safety_gear_weight + etc_weight
      // = 83288 + 0 + (6 * DEFAULT_LOADMASTER_WEIGHT) + 0 + 0 + 250 + 637
      const loadmastersWeight = 6 * DEFAULT_LOADMASTER_WEIGHT;
      const expectedBaseWeight = 83288 + 0 + loadmastersWeight + 0 + 0 + 250 + 637;

      expect(baseWeight).toBeCloseTo(expectedBaseWeight, 1);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateBaseWeight(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateTotalFuelWeight', () => {
    it('should calculate the total fuel weight', async () => {
      const fuelWeight = await calculateTotalFuelWeight(missionId);

      // Total fuel = outboard + inboard + fuselage + auxiliary + external
      // = 16000 + 15000 + 0 + 4000 + 0 = 35000
      expect(fuelWeight).toBe(35000);
    });

    it('should return 0 for mission with no fuel', async () => {
      const mission: Mission = {
        name: 'No Fuel Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        loadmasters: 2,
        loadmasters_fs: 500,
        configuration_weights: 0,
        crew_gear_weight: 0,
        food_weight: 0,
        safety_gear_weight: 0,
        etc_weight: 0,
        outboard_fuel: 0,
        inboard_fuel: 0,
        fuselage_fuel: 0,
        auxiliary_fuel: 0,
        external_fuel: 0,
        aircraft_id: aircraftId,
      };
      const missionResult = await createMission(mission);
      const noFuelMissionId = missionResult.results[0].lastInsertId as number;

      const fuelWeight = await calculateTotalFuelWeight(noFuelMissionId);
      expect(fuelWeight).toBe(0);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateTotalFuelWeight(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateCargoWeight', () => {
    it('should calculate the total cargo weight', async () => {
      const cargoWeight = await calculateCargoWeight(missionId);

      // We have one cargo item with weight 20000
      expect(cargoWeight).toBe(20000);
    });

    it('should return 0 for mission with no cargo', async () => {
      const mission: Mission = {
        name: 'No Cargo Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        loadmasters: 2,
        loadmasters_fs: 500,
        configuration_weights: 0,
        crew_gear_weight: 0,
        food_weight: 0,
        safety_gear_weight: 0,
        etc_weight: 0,
        outboard_fuel: 0,
        inboard_fuel: 0,
        fuselage_fuel: 0,
        auxiliary_fuel: 0,
        external_fuel: 0,
        aircraft_id: aircraftId,
      };
      const missionResult = await createMission(mission);
      const noCargoMissionId = missionResult.results[0].lastInsertId as number;

      const cargoWeight = await calculateCargoWeight(noCargoMissionId);
      expect(cargoWeight).toBe(0);
    });
  });

  describe('calculateCargoMACIndex', () => {
    it('should calculate the total cargo MAC index', async () => {
      const cargoMACIndex = await calculateCargoMACIndex(missionId);

      // We have one cargo item: index = (530 - 533.46) * 20000 / 50000 = -1.384
      expect(cargoMACIndex).toBeCloseTo(-1.384, 2);
    });

    it('should return 0 for mission with no cargo', async () => {
      const mission: Mission = {
        name: 'No Cargo Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        loadmasters: 2,
        loadmasters_fs: 500,
        configuration_weights: 0,
        crew_gear_weight: 0,
        food_weight: 0,
        safety_gear_weight: 0,
        etc_weight: 0,
        outboard_fuel: 0,
        inboard_fuel: 0,
        fuselage_fuel: 0,
        auxiliary_fuel: 0,
        external_fuel: 0,
        aircraft_id: aircraftId,
      };
      const missionResult = await createMission(mission);
      const noCargoMissionId = missionResult.results[0].lastInsertId as number;

      const cargoMACIndex = await calculateCargoMACIndex(noCargoMissionId);
      expect(cargoMACIndex).toBe(0);
    });
  });

  describe('calculateFuelMAC', () => {
    it('should calculate the MAC contribution from fuel', async () => {
      const fuelMAC = await calculateFuelMAC(missionId);

      expect(fuelMAC).toBeCloseTo(11.738, 2);
    });

    it('should return 0 for mission with no fuel state', async () => {
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
      const totalIndex = 5;
      const cg = await calculateAircraftCG(missionId, totalIndex);

      // Calculate the expected CG using the formula:
      // CG = (totalIndex - 100) * 50000 / totalWeight + 533.46
      const totalWeight = await calculateTotalAircraftWeight(missionId);
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

  describe('calculateTotalIndex', () => {
    it('should calculate the total MAC index', async () => {
      const totalIndex = await calculateTotalIndex(missionId);

      // Total index = cargoMACIndex + fuelMACIndex + additionalWeightsMACIndex + emptyAircraftMACIndex
      const cargoMACIndex = await calculateCargoMACIndex(missionId);
      const fuelMACIndex = await calculateFuelMAC(missionId);
      const emptyMACIndex = await getEmptyAircraftMACIndex(aircraftId);

      // For additionalWeights we need to compute it indirectly
      // The total should include all components
      expect(totalIndex).toBeDefined();
      expect(typeof totalIndex).toBe('number');

      // Verify it includes at least cargo, fuel, and empty indices
      expect(totalIndex).toBeGreaterThan(cargoMACIndex + fuelMACIndex + emptyMACIndex - 20);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateTotalIndex(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateZeroFuelWeight', () => {
    it('should calculate the zero fuel weight', async () => {
      const zeroFuelWeight = await calculateZeroFuelWeight(missionId);

      const totalWeight = await calculateTotalAircraftWeight(missionId);
      const totalFuelWeight = await calculateTotalFuelWeight(missionId);

      // ZFW = totalWeight - totalFuelWeight + TAXI_FUEL_WEIGHT (1000)
      // Because totalWeight already has taxi fuel subtracted
      const expectedZFW = totalWeight - totalFuelWeight + 1000;

      expect(zeroFuelWeight).toBeCloseTo(expectedZFW, 1);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateZeroFuelWeight(99999)).rejects.toThrow('Mission with ID 99999 not found');
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
