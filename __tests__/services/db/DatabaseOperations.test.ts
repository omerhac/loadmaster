import {
  DatabaseFactory,
  initializeLoadmasterDatabase,
  Aircraft,
  Mission,
  CargoType,
  CargoItem,
  FuelState,
  FuelMacQuant,
  Compartment,
  LoadConstraint,
  User,
  createAircraft,
  getAircraftById,
  getAllAircraft,
  updateAircraft,
  deleteAircraft,
  createMission,
  getMissionById,
  getAllMissions,
  getMissionsByAircraftId,
  updateMission,
  deleteMission,
  createCargoType,
  getCargoTypeById,
  getAllCargoTypes,
  getCargoTypesByUserId,
  updateCargoType,
  deleteCargoType,
  createCargoItem,
  getCargoItemById,
  getCargoItemsByMissionId,
  updateCargoItem,
  deleteCargoItem,
  createFuelState,
  getFuelStateByMissionId,
  updateFuelState,
  createFuelMacQuant,
  getAllFuelMacQuants,
  createCompartment,
  getCompartmentById,
  getCompartmentsByAircraftId,
  updateCompartment,
  deleteCompartment,
  createLoadConstraint,
  getLoadConstraintsByCompartmentId,
  updateLoadConstraint,
  deleteLoadConstraint,
  createUser,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
} from '@/services/db';
import { TestDatabaseService } from '@/services/db/TestDatabaseService';

describe('DatabaseOperations Integration Tests', () => {
  let testDb: TestDatabaseService;

  // Helper function to clear the database tables
  async function clearDatabaseTables(db: TestDatabaseService) {
    await db.executeQuery('DELETE FROM load_constraints;');
    await db.executeQuery('DELETE FROM compartment;');
    await db.executeQuery('DELETE FROM fuel_mac_quants;');
    await db.executeQuery('DELETE FROM fuel_state;');
    await db.executeQuery('DELETE FROM cargo_item;');
    await db.executeQuery('DELETE FROM cargo_type;');
    await db.executeQuery('DELETE FROM mission;');
    await db.executeQuery('DELETE FROM aircraft;');
    await db.executeQuery('DELETE FROM user;');
  }

  beforeAll(async () => {
    // Reset the database factory singleton for testing
    DatabaseFactory.resetInstance();

    // Get the test database service
    testDb = await TestDatabaseService.initialize() as TestDatabaseService;

    // Ensure it's used by the DatabaseFactory
    jest.spyOn(DatabaseFactory, 'getDatabase').mockResolvedValue(testDb);

    // Initialize database schema
    await initializeLoadmasterDatabase();
  });

  beforeEach(async () => {
    // Clear all table data before each test
    await testDb.executeQuery('DELETE FROM load_constraints;');
    await testDb.executeQuery('DELETE FROM compartment;');
    await testDb.executeQuery('DELETE FROM fuel_mac_quants;');
    await testDb.executeQuery('DELETE FROM fuel_state;');
    await testDb.executeQuery('DELETE FROM cargo_item;');
    await testDb.executeQuery('DELETE FROM cargo_type;');
    await testDb.executeQuery('DELETE FROM mission;');
    await testDb.executeQuery('DELETE FROM aircraft;');
    await testDb.executeQuery('DELETE FROM user;');
  });

  afterAll(async () => {
    // Reset the spy and database
    jest.restoreAllMocks();
    try {
      await clearDatabaseTables(testDb);
    } catch (error) {
      console.log('Could not clear tables in afterAll');
    }
    DatabaseFactory.resetInstance();
  });

  // ===== User Tests =====
  describe('User Operations', () => {
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

  // ===== Aircraft Tests =====
  describe('Aircraft Operations', () => {
    it('should create and retrieve an aircraft', async () => {
      // Create test aircraft
      const aircraft: Aircraft = {
        type: 'C-130',
        name: 'Hercules',
        empty_weight: 35000,
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

  // ===== Mission and Related Tests =====
  describe('Mission and Related Operations', () => {
    let aircraftId: number;

    beforeEach(async () => {
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

    it('should create and retrieve a mission', async () => {
      // Create test mission
      const mission: Mission = {
        name: 'Test Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        total_weight: 5000,
        total_mac_percent: 30,
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

    it('should retrieve missions by aircraft id', async () => {
      // Create multiple missions for the same aircraft
      const mission1: Mission = {
        name: 'Mission 1',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        total_weight: 5000,
        total_mac_percent: 30,
        aircraft_id: aircraftId,
      };

      const mission2: Mission = {
        name: 'Mission 2',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        total_weight: 6000,
        total_mac_percent: 32,
        aircraft_id: aircraftId,
      };

      await createMission(mission1);
      await createMission(mission2);

      // Get missions by aircraft ID
      const getResult = await getMissionsByAircraftId(aircraftId);
      expect(getResult.count).toBe(2);
    });

    it('should create and manage cargo items within a mission', async () => {
      // Create a cargo type first
      const cargoType: CargoType = {
        name: 'Cargo Box',
        default_weight: 500,
        default_length: 2,
        default_width: 1.5,
        default_height: 1,
        default_forward_overhang: 0.1,
        default_back_overhang: 0.1,
        type: 'bulk',
      };

      const cargoTypeResult = await createCargoType(cargoType);
      const cargoTypeId = cargoTypeResult.results[0].lastInsertId as number;

      // Create a mission
      const mission: Mission = {
        name: 'Cargo Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        total_weight: 5000,
        total_mac_percent: 30,
        aircraft_id: aircraftId,
      };

      const missionResult = await createMission(mission);
      const missionId = missionResult.results[0].lastInsertId as number;

      // Create cargo items for this mission
      const cargoItem1: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Box 1',
        x_start_position: 10,
        y_start_position: 5,
      };

      const cargoItem2: CargoItem = {
        mission_id: missionId,
        cargo_type_id: cargoTypeId,
        name: 'Box 2',
        x_start_position: 15,
        y_start_position: 5,
      };

      await createCargoItem(cargoItem1);
      await createCargoItem(cargoItem2);

      // Get cargo items by mission ID
      const getResult = await getCargoItemsByMissionId(missionId);
      expect(getResult.count).toBe(2);

      // Get cargo type for verification
      const getTypeResult = await getCargoTypeById(cargoTypeId);
      expect(getTypeResult.results[0].data?.name).toBe('Cargo Box');
    });

    it('should create and manage fuel state for a mission', async () => {
      // Create a mission
      const mission: Mission = {
        name: 'Fuel Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        total_weight: 5000,
        total_mac_percent: 30,
        aircraft_id: aircraftId,
      };

      const missionResult = await createMission(mission);
      const missionId = missionResult.results[0].lastInsertId as number;

      // Create fuel state
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

      await createFuelState(fuelState);

      // Get fuel state by mission ID
      const getResult = await getFuelStateByMissionId(missionId);
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.total_fuel).toBe(10000);
      expect(getResult.results[0].data?.mac_contribution).toBe(8.5);
    });
  });

  // ===== Compartment and Load Constraints Tests =====
  describe('Compartment and Load Constraint Operations', () => {
    let aircraftId: number;

    beforeEach(async () => {
      // Create an aircraft for compartment tests
      const aircraft: Aircraft = {
        type: 'Compartment',
        name: 'Test',
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

    it('should create and retrieve compartments', async () => {
      // Create compartment
      const compartment: Compartment = {
        aircraft_id: aircraftId,
        name: 'Forward Hold',
        x_start: 10,
        x_end: 30,
        floor_area: 20,
        usable_volume: 100,
      };

      const createResult = await createCompartment(compartment);
      expect(createResult.results[0].lastInsertId).toBeTruthy();

      const compartmentId = createResult.results[0].lastInsertId;

      // Get compartment by ID
      const getResult = await getCompartmentById(compartmentId as number);
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.name).toBe('Forward Hold');
    });

    it('should retrieve compartments by aircraft id', async () => {
      // Create multiple compartments
      const compartment1: Compartment = {
        aircraft_id: aircraftId,
        name: 'Forward Hold',
        x_start: 10,
        x_end: 30,
        floor_area: 20,
        usable_volume: 100,
      };

      const compartment2: Compartment = {
        aircraft_id: aircraftId,
        name: 'Aft Hold',
        x_start: 40,
        x_end: 60,
        floor_area: 20,
        usable_volume: 100,
      };

      await createCompartment(compartment1);
      await createCompartment(compartment2);

      // Get compartments by aircraft ID
      const getResult = await getCompartmentsByAircraftId(aircraftId);
      expect(getResult.count).toBe(2);
    });

    it('should create and manage load constraints for a compartment', async () => {
      // Create compartment
      const compartment: Compartment = {
        aircraft_id: aircraftId,
        name: 'Load Test',
        x_start: 10,
        x_end: 30,
        floor_area: 20,
        usable_volume: 100,
      };

      const compartmentResult = await createCompartment(compartment);
      const compartmentId = compartmentResult.results[0].lastInsertId as number;

      // Create load constraints
      const loadConstraint1: LoadConstraint = {
        compartment_id: compartmentId,
        constraint_type: 'cumulative',
        max_cumulative_weight: 5000,
      };

      const loadConstraint2: LoadConstraint = {
        compartment_id: compartmentId,
        constraint_type: 'concentrated',
        max_concentrated_load: 1000,
      };

      await createLoadConstraint(loadConstraint1);
      await createLoadConstraint(loadConstraint2);

      // Get load constraints by compartment ID
      const getResult = await getLoadConstraintsByCompartmentId(compartmentId);
      expect(getResult.count).toBe(2);

      // Verify the constraints were created correctly
      const cumulativeConstraint = getResult.results.find(r => r.data?.constraint_type === 'cumulative');
      const concentratedConstraint = getResult.results.find(r => r.data?.constraint_type === 'concentrated');

      expect(cumulativeConstraint?.data?.max_cumulative_weight).toBe(5000);
      expect(concentratedConstraint?.data?.max_concentrated_load).toBe(1000);
    });
  });

  // ===== FuelMacQuant Tests =====
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
