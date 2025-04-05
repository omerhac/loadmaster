import {
  calculateMACPercent,
  calculateMACIndex,
  calculateAircraftCG,
  calculateAdditionalWeightsMAC,
  calculateTotalAircraftWeight,
  calculateFuelMAC
} from '../../../src/services/mac';

import { setupTestDatabase, cleanupTestDatabase } from '../db/testHelpers';
import { 
  Aircraft, 
  Mission, 
  CargoType, 
  CargoItem,
  FuelState,
  createAircraft,
  createMission,
  createCargoType,
  createCargoItem,
  createFuelState
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
      empty_weight: 75000,
      empty_mac: 25,
      cargo_bay_width: 10,
      treadways_width: 2,
      treadways_dist_from_center: 1,
      ramp_length: 10,
      ramp_max_incline: 15,
      ramp_min_incline: 5
    };
    const aircraftResult = await createAircraft(aircraft);
    aircraftId = aircraftResult.results[0].lastInsertId as number;

    // Create test mission
    const mission: Mission = {
      name: 'Test Mission',
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      total_weight: 100000,
      total_mac_percent: 25,
      crew_weight: 1000,
      configuration_weights: 500,
      crew_gear_weight: 300,
      food_weight: 200,
      safety_gear_weight: 150,
      etc_weight: 100,
      aircraft_id: aircraftId
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
      type: 'bulk'
    };
    const cargoTypeResult = await createCargoType(cargoType);
    cargoTypeId = cargoTypeResult.results[0].lastInsertId as number;

    // Create test cargo item
    const cargoItem: CargoItem = {
      mission_id: missionId,
      cargo_type_id: cargoTypeId,
      name: 'Test Cargo Item',
      weight: 2000,
      length: 5,
      width: 3,
      height: 2,
      forward_overhang: 0.5,
      back_overhang: 0.5,
      x_start_position: 500,
      y_start_position: 2
    };
    const cargoItemResult = await createCargoItem(cargoItem);
    cargoItemId = cargoItemResult.results[0].lastInsertId as number;

    // Create test fuel state
    const fuelState: FuelState = {
      mission_id: missionId,
      total_fuel: 10000,
      main_tank_1_fuel: 2500,
      main_tank_2_fuel: 2500,
      main_tank_3_fuel: 2500,
      main_tank_4_fuel: 2500,
      external_1_fuel: 0,
      external_2_fuel: 0,
      mac_contribution: 1.5
    };
    await createFuelState(fuelState);
  });

  describe('calculateMACIndex', () => {
    it('should calculate the MAC index for a cargo item', async () => {
      const macIndex = await calculateMACIndex(cargoItemId);
      
      // The expected value is based on the formula:
      // (centerX - 533.46) * weight / 50000
      // centerX = x_start_position + (length / 2) = 500 + (5 / 2) = 502.5
      // index = (502.5 - 533.46) * 2000 / 50000 = -1.2384
      
      expect(macIndex).toBeCloseTo(-1.24, 2);
    });

    it('should throw an error for non-existent cargo item', async () => {
      await expect(calculateMACIndex(99999)).rejects.toThrow('Cargo item with ID 99999 not found');
    });
  });

  describe('calculateAdditionalWeightsMAC', () => {
    it('should calculate the MAC contribution from additional weights', async () => {
      const additionalMAC = await calculateAdditionalWeightsMAC(missionId);
      
      // Calculate expected value based on the formula in the documentation:
      // Sum of (station - 533.46) * weight / 50000 for each weight type
      const CREW_STATION = 450.0;
      const CONFIG_STATION = 500.0;
      const CREW_GEAR_STATION = 520.0;
      const FOOD_STATION = 480.0;
      const SAFETY_GEAR_STATION = 510.0;
      const ETC_STATION = 490.0;
      
      // Crew weight: 1000
      // Config weights: 500
      // Crew gear weight: 300
      // Food weight: 200
      // Safety gear weight: 150
      // ETC weight: 100
      
      // Calculate each component
      const crewComponent = (CREW_STATION - 533.46) * 1000 / 50000;
      const configComponent = (CONFIG_STATION - 533.46) * 500 / 50000;
      const crewGearComponent = (CREW_GEAR_STATION - 533.46) * 300 / 50000;
      const foodComponent = (FOOD_STATION - 533.46) * 200 / 50000;
      const safetyComponent = (SAFETY_GEAR_STATION - 533.46) * 150 / 50000;
      const etcComponent = (ETC_STATION - 533.46) * 100 / 50000;
      
      // Sum all components
      const expectedMAC = crewComponent + configComponent + crewGearComponent + 
                         foodComponent + safetyComponent + etcComponent;
      
      expect(additionalMAC).toBeCloseTo(expectedMAC, 2);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateAdditionalWeightsMAC(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateTotalAircraftWeight', () => {
    it('should calculate the total aircraft weight', async () => {
      const totalWeight = await calculateTotalAircraftWeight(missionId);
      
      // Expected value: aircraft.empty_weight + all additional weights + cargo weight + fuel weight
      // aircraft.empty_weight = 75000
      // crew_weight = 1000, configuration_weights = 500, crew_gear_weight = 300, 
      // food_weight = 200, safety_gear_weight = 150, etc_weight = 100
      // cargo weight = 2000
      // fuel weight = 10000
      // Total = 75000 + 1000 + 500 + 300 + 200 + 150 + 100 + 2000 + 10000 = 89250
      
      expect(totalWeight).toBeCloseTo(89250, 1);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateTotalAircraftWeight(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateFuelMAC', () => {
    it('should calculate the MAC contribution from fuel', async () => {
      const fuelMAC = await calculateFuelMAC(missionId);
      
      // The test fuel state has these values:
      // main_tank_1_fuel: 2500
      // main_tank_2_fuel: 2500
      // main_tank_3_fuel: 2500
      // main_tank_4_fuel: 2500
      // external_1_fuel: 0
      // external_2_fuel: 0
      // mac_contribution: 1.5 (provided directly in the test fuel state)
      
      // Since we're using the fuel_state.mac_contribution value in our implementation
      // expect the returned value to match that
      expect(fuelMAC).toBeCloseTo(1.5, 2);
    });

    it('should return 0 for mission with no fuel state', async () => {
      // Create a mission with no fuel state
      const mission: Mission = {
        name: 'No Fuel Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        total_weight: 100000,
        total_mac_percent: 25,
        crew_weight: 1000,
        configuration_weights: 500,
        crew_gear_weight: 300,
        food_weight: 200,
        safety_gear_weight: 150,
        etc_weight: 100,
        aircraft_id: aircraftId
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
      // CG = (totalIndex - 100) * 50000 / totalWeight
      
      // We need to calculate totalWeight first
      const totalWeight = await calculateTotalAircraftWeight(missionId);
      
      // Now apply the formula
      const expectedCG = (totalIndex - 100) * 50000 / totalWeight;
      
      expect(cg).toBeCloseTo(expectedCG, 2);
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateAircraftCG(99999, 5)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });

  describe('calculateMACPercent', () => {
    it('should calculate the MAC percentage for a mission', async () => {
      const macPercent = await calculateMACPercent(missionId);
      
      // DETAILED CALCULATION STEPS:
      
      // Step 1: Calculate cargo MAC contribution
      // Cargo item: weight=2000, x_start_position=500, length=5
      // centerX = 500 + (5/2) = 502.5
      // Cargo MAC index = (502.5 - 533.46) * 2000 / 50000 = -1.2384
      
      // Step 2: Calculate additional weights MAC contribution
      // Using these station values:
      // CREW_STATION = 450.0, crew_weight = 1000
      // CONFIG_STATION = 500.0, configuration_weights = 500
      // CREW_GEAR_STATION = 520.0, crew_gear_weight = 300
      // FOOD_STATION = 480.0, food_weight = 200
      // SAFETY_GEAR_STATION = 510.0, safety_gear_weight = 150
      // ETC_STATION = 490.0, etc_weight = 100
      
      // Each weight's contribution = (station - 533.46) * weight / 50000
      // Crew: (450 - 533.46) * 1000 / 50000 = -1.6692
      // Config: (500 - 533.46) * 500 / 50000 = -0.3346
      // Crew Gear: (520 - 533.46) * 300 / 50000 = -0.08076
      // Food: (480 - 533.46) * 200 / 50000 = -0.21384
      // Safety: (510 - 533.46) * 150 / 50000 = -0.07038
      // ETC: (490 - 533.46) * 100 / 50000 = -0.08692
      // Total Additional Weights MAC = -2.4557
      
      // Step 3: Calculate fuel MAC contribution
      // Using the fuel state's mac_contribution value directly: 1.5
      
      // Step 4: Calculate total MAC index
      // Total MAC index = Cargo MAC + Additional Weights MAC + Fuel MAC
      // Total MAC index = -1.2384 + (-2.4557) + 1.5 = -2.1941
      
      // Step 5: Calculate aircraft CG
      // Total Weight = aircraft.empty_weight + all weights + cargo + fuel
      //               = 75000 + 1000 + 500 + 300 + 200 + 150 + 100 + 2000 + 10000 = 89250
      // CG = (totalIndex - 100) * 50000 / totalWeight
      // CG = (-2.1941 - 100) * 50000 / 89250 = -57.36
      
      // Step 6: Calculate MAC percentage
      // MAC percent = (CG - 487.4) * 100 / 164.5
      // MAC percent = (-57.36 - 487.4) * 100 / 164.5 = -331.10
      
      // Verify the result is close to the calculated value
      expect(macPercent).toBeCloseTo(-331.10, 1);
      
      // Also verify it's a valid number
      expect(macPercent).toBeDefined();
      expect(typeof macPercent).toBe('number');
    });

    it('should throw an error for non-existent mission', async () => {
      await expect(calculateMACPercent(99999)).rejects.toThrow('Mission with ID 99999 not found');
    });
  });
}); 