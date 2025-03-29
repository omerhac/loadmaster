import {
  AllowedMacConstraint,
  createAllowedMacConstraint,
  getAllowedMacConstraintById,
  getAllAllowedMacConstraints,
  getAllowedMacConstraintByWeight,
  updateAllowedMacConstraint,
  deleteAllowedMacConstraint,
} from '../../../../src/services/db/operations';
import { setupTestDatabase, cleanupTestDatabase } from '../testHelpers';

describe('AllowedMacConstraint Operations', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  it('should create and retrieve an allowed MAC constraint', async () => {
    // Create test constraint
    const constraint: AllowedMacConstraint = {
      gross_aircraft_weight: 150000,
      min_mac: 15.5,
      max_mac: 25.8,
    };

    const createResult = await createAllowedMacConstraint(constraint);
    expect(createResult.results[0].lastInsertId).toBeTruthy();

    const constraintId = createResult.results[0].lastInsertId;

    // Get constraint by ID
    const getResult = await getAllowedMacConstraintById(constraintId as number);
    expect(getResult.count).toBe(1);
    
    const retrievedConstraint = getResult.results[0].data as AllowedMacConstraint;
    expect(retrievedConstraint.gross_aircraft_weight).toBe(150000);
    expect(retrievedConstraint.min_mac).toBe(15.5);
    expect(retrievedConstraint.max_mac).toBe(25.8);
  });

  it('should get all allowed MAC constraints', async () => {
    // Create multiple test constraints
    const constraints = [
      {
        gross_aircraft_weight: 140000,
        min_mac: 14.0,
        max_mac: 24.0,
      },
      {
        gross_aircraft_weight: 160000,
        min_mac: 16.0,
        max_mac: 26.0,
      },
      {
        gross_aircraft_weight: 180000,
        min_mac: 18.0,
        max_mac: 28.0,
      },
    ];

    for (const constraint of constraints) {
      await createAllowedMacConstraint(constraint);
    }

    // Get all constraints
    const result = await getAllAllowedMacConstraints();
    expect(result.count).toBe(3);
    
    // Data should be ordered by gross_aircraft_weight
    const resultRows = result.results.map(r => r.data as AllowedMacConstraint);
    for (let i = 1; i < resultRows.length; i++) {
      expect(resultRows[i].gross_aircraft_weight).toBeGreaterThanOrEqual(resultRows[i-1].gross_aircraft_weight);
    }
  });

  it('should get allowed MAC constraint by weight', async () => {
    // Create multiple test constraints with different weights
    const constraints = [
      {
        gross_aircraft_weight: 140000,
        min_mac: 14.0,
        max_mac: 24.0,
      },
      {
        gross_aircraft_weight: 160000,
        min_mac: 16.0,
        max_mac: 26.0,
      },
      {
        gross_aircraft_weight: 180000,
        min_mac: 18.0,
        max_mac: 28.0,
      },
    ];

    for (const constraint of constraints) {
      await createAllowedMacConstraint(constraint);
    }

    // Test exact match
    let result = await getAllowedMacConstraintByWeight(160000);
    expect(result.count).toBe(1);
    expect((result.results[0].data as AllowedMacConstraint).gross_aircraft_weight).toBe(160000);

    // Test weight in between constraints (should get the upper one)
    result = await getAllowedMacConstraintByWeight(150000);
    expect(result.count).toBe(1);
    expect((result.results[0].data as AllowedMacConstraint).gross_aircraft_weight).toBe(160000);

    // Test weight below all constraints (should get the lowest constraint)
    result = await getAllowedMacConstraintByWeight(130000);
    expect(result.count).toBe(1);
    expect((result.results[0].data as AllowedMacConstraint).gross_aircraft_weight).toBe(140000);
    
    // Test weight above all constraints (should get the highest constraint)
    result = await getAllowedMacConstraintByWeight(200000);
    expect(result.count).toBe(1);
    expect((result.results[0].data as AllowedMacConstraint).gross_aircraft_weight).toBe(180000);
  });

  it('should update allowed MAC constraint', async () => {
    // Create test constraint
    const constraint: AllowedMacConstraint = {
      gross_aircraft_weight: 150000,
      min_mac: 15.5,
      max_mac: 25.8,
    };

    const createResult = await createAllowedMacConstraint(constraint);
    const constraintId = createResult.results[0].lastInsertId;

    // Update constraint
    const constraintToUpdate: AllowedMacConstraint = {
      id: constraintId as number,
      gross_aircraft_weight: 155000,
      min_mac: 16.0,
      max_mac: 26.5,
    };

    await updateAllowedMacConstraint(constraintToUpdate);

    // Verify update
    const getResult = await getAllowedMacConstraintById(constraintId as number);
    const updatedConstraint = getResult.results[0].data as AllowedMacConstraint;
    expect(updatedConstraint.gross_aircraft_weight).toBe(155000);
    expect(updatedConstraint.min_mac).toBe(16.0);
    expect(updatedConstraint.max_mac).toBe(26.5);
  });

  it('should delete allowed MAC constraint', async () => {
    // Create test constraint
    const constraint: AllowedMacConstraint = {
      gross_aircraft_weight: 150000,
      min_mac: 15.5,
      max_mac: 25.8,
    };

    const createResult = await createAllowedMacConstraint(constraint);
    const constraintId = createResult.results[0].lastInsertId;

    // Delete constraint
    await deleteAllowedMacConstraint(constraintId as number);

    // Verify deletion
    const getResult = await getAllowedMacConstraintById(constraintId as number);
    expect(getResult.count).toBe(0);
  });

  it('should throw error when updating without ID', async () => {
    // Create constraint without ID
    const constraint: AllowedMacConstraint = {
      gross_aircraft_weight: 150000,
      min_mac: 15.5,
      max_mac: 25.8,
    };

    // Attempt to update without ID
    await expect(updateAllowedMacConstraint(constraint)).rejects.toThrow(
      'Constraint ID is required for update operation'
    );
  });
}); 