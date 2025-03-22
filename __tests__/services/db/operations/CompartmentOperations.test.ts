import {
  Aircraft,
  Compartment,
  LoadConstraint,
  createAircraft,
  createCompartment,
  getCompartmentById,
  getCompartmentsByAircraftId,
  updateCompartment,
  deleteCompartment,
  createLoadConstraint,
  getLoadConstraintsByCompartmentId,
  updateLoadConstraint,
  deleteLoadConstraint,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('Compartment Operations', () => {
  let aircraftId: number;

  beforeEach(async () => {
    await setupTestDatabase();

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

  afterAll(() => {
    cleanupTestDatabase();
  });

  describe('Compartment Operations', () => {
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

    it('should update compartment', async () => {
      // Create compartment
      const compartment: Compartment = {
        aircraft_id: aircraftId,
        name: 'Update Hold',
        x_start: 10,
        x_end: 30,
        floor_area: 20,
        usable_volume: 100,
      };

      const createResult = await createCompartment(compartment);
      const compartmentId = createResult.results[0].lastInsertId as number;

      // Update compartment
      const updatedCompartment: Compartment = {
        id: compartmentId,
        aircraft_id: aircraftId,
        name: 'Updated Hold',
        x_start: 15,
        x_end: 35,
        floor_area: 25,
        usable_volume: 120,
      };

      await updateCompartment(updatedCompartment);

      // Verify update
      const getResult = await getCompartmentById(compartmentId);
      expect(getResult.results[0].data?.name).toBe('Updated Hold');
      expect(getResult.results[0].data?.x_start).toBe(15);
      expect(getResult.results[0].data?.floor_area).toBe(25);
    });

    it('should delete compartment', async () => {
      // Create compartment
      const compartment: Compartment = {
        aircraft_id: aircraftId,
        name: 'Delete Hold',
        x_start: 10,
        x_end: 30,
        floor_area: 20,
        usable_volume: 100,
      };

      const createResult = await createCompartment(compartment);
      const compartmentId = createResult.results[0].lastInsertId as number;

      // Delete compartment
      await deleteCompartment(compartmentId);

      // Verify deletion
      const getResult = await getCompartmentById(compartmentId);
      expect(getResult.count).toBe(0);
    });
  });

  describe('LoadConstraint Operations', () => {
    let compartmentId: number;

    beforeEach(async () => {
      // Create compartment for load constraint tests
      const compartment: Compartment = {
        aircraft_id: aircraftId,
        name: 'Load Test',
        x_start: 10,
        x_end: 30,
        floor_area: 20,
        usable_volume: 100,
      };

      const compartmentResult = await createCompartment(compartment);
      compartmentId = compartmentResult.results[0].lastInsertId as number;
    });

    it('should create and retrieve load constraints', async () => {
      // Create load constraint
      const loadConstraint: LoadConstraint = {
        compartment_id: compartmentId,
        constraint_type: 'cumulative',
        max_cumulative_weight: 5000,
      };

      const createResult = await createLoadConstraint(loadConstraint);
      expect(createResult.results[0].lastInsertId).toBeTruthy();

      // Get load constraints by compartment ID
      const getResult = await getLoadConstraintsByCompartmentId(compartmentId);
      expect(getResult.count).toBe(1);
      expect(getResult.results[0].data?.constraint_type).toBe('cumulative');
      expect(getResult.results[0].data?.max_cumulative_weight).toBe(5000);
    });

    it('should create multiple load constraint types for a compartment', async () => {
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

    it('should update load constraint', async () => {
      // Create load constraint
      const loadConstraint: LoadConstraint = {
        compartment_id: compartmentId,
        constraint_type: 'cumulative',
        max_cumulative_weight: 5000,
      };

      const createResult = await createLoadConstraint(loadConstraint);
      const constraintId = createResult.results[0].lastInsertId as number;

      // Update load constraint
      const updatedConstraint: LoadConstraint = {
        id: constraintId,
        compartment_id: compartmentId,
        constraint_type: 'cumulative',
        max_cumulative_weight: 6000,
      };

      await updateLoadConstraint(updatedConstraint);

      // Verify update
      const getResult = await getLoadConstraintsByCompartmentId(compartmentId);
      expect(getResult.results[0].data?.max_cumulative_weight).toBe(6000);
    });

    it('should delete load constraint', async () => {
      // Create load constraint
      const loadConstraint: LoadConstraint = {
        compartment_id: compartmentId,
        constraint_type: 'cumulative',
        max_cumulative_weight: 5000,
      };

      const createResult = await createLoadConstraint(loadConstraint);
      const constraintId = createResult.results[0].lastInsertId as number;

      // Delete load constraint
      await deleteLoadConstraint(constraintId);

      // Get load constraints by compartment ID
      const getResult = await getLoadConstraintsByCompartmentId(compartmentId);
      expect(getResult.count).toBe(0);
    });
  });
});
