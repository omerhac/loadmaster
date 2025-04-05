/**
 * Database operations for fuel-related entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { FuelState, FuelMacQuant } from './types';

// ============= FuelState Operations =============

/**
 * Create a new fuel state
 */
export async function createFuelState(fuelState: FuelState): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO fuel_state (
      mission_id, total_fuel, main_tank_1_fuel, main_tank_2_fuel,
      main_tank_3_fuel, main_tank_4_fuel, external_1_fuel,
      external_2_fuel, mac_contribution
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    fuelState.mission_id,
    fuelState.total_fuel,
    fuelState.main_tank_1_fuel,
    fuelState.main_tank_2_fuel,
    fuelState.main_tank_3_fuel,
    fuelState.main_tank_4_fuel,
    fuelState.external_1_fuel,
    fuelState.external_2_fuel,
    fuelState.mac_contribution,
  ]);
}

/**
 * Get fuel state by mission ID
 */
export async function getFuelStateByMissionId(missionId: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM fuel_state WHERE mission_id = ?;', [missionId]);
}

/**
 * Update fuel state
 */
export async function updateFuelState(fuelState: FuelState): Promise<DatabaseResponse> {
  if (!fuelState.id) {
    throw new Error('Fuel state ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE fuel_state
    SET total_fuel = ?, main_tank_1_fuel = ?, main_tank_2_fuel = ?,
        main_tank_3_fuel = ?, main_tank_4_fuel = ?, external_1_fuel = ?,
        external_2_fuel = ?, mac_contribution = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    fuelState.total_fuel,
    fuelState.main_tank_1_fuel,
    fuelState.main_tank_2_fuel,
    fuelState.main_tank_3_fuel,
    fuelState.main_tank_4_fuel,
    fuelState.external_1_fuel,
    fuelState.external_2_fuel,
    fuelState.mac_contribution,
    fuelState.id,
  ]);
}

// ============= FuelMacQuant Operations =============

/**
 * Create a new fuel MAC quantity entry
 */
export async function createFuelMacQuant(fuelMacQuant: FuelMacQuant): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO fuel_mac_quants (
      main_tank_1_fuel, main_tank_2_fuel, main_tank_3_fuel,
      main_tank_4_fuel, external_1_fuel, external_2_fuel,
      mac_contribution
    )
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    fuelMacQuant.main_tank_1_fuel,
    fuelMacQuant.main_tank_2_fuel,
    fuelMacQuant.main_tank_3_fuel,
    fuelMacQuant.main_tank_4_fuel,
    fuelMacQuant.external_1_fuel,
    fuelMacQuant.external_2_fuel,
    fuelMacQuant.mac_contribution,
  ]);
}

/**
 * Get all fuel MAC quantities
 */
export async function getAllFuelMacQuants(): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM fuel_mac_quants;');
}

/**
 * Finds the closest matching fuel configuration in the reference table
 * Uses the closest upper value from each tank and treats the fuel contribution
 * table as an outer product matrix of all tanks.
 * @returns An object with mac_contribution property
 */
export async function findClosestFuelMacConfiguration(
  tank1: number,
  tank2: number,
  tank3: number,
  tank4: number,
  ext1: number,
  ext2: number
): Promise<{ mac_contribution: number }> {
  const db = await DatabaseFactory.getDatabase();

  // Get all distinct fuel quantities from the fuel_mac_quants table
  const tank1ValuesResult = await db.executeQuery(
    'SELECT DISTINCT main_tank_1_fuel FROM fuel_mac_quants ORDER BY main_tank_1_fuel'
  );
  const tank2ValuesResult = await db.executeQuery(
    'SELECT DISTINCT main_tank_2_fuel FROM fuel_mac_quants ORDER BY main_tank_2_fuel'
  );
  const tank3ValuesResult = await db.executeQuery(
    'SELECT DISTINCT main_tank_3_fuel FROM fuel_mac_quants ORDER BY main_tank_3_fuel'
  );
  const tank4ValuesResult = await db.executeQuery(
    'SELECT DISTINCT main_tank_4_fuel FROM fuel_mac_quants ORDER BY main_tank_4_fuel'
  );
  const ext1ValuesResult = await db.executeQuery(
    'SELECT DISTINCT external_1_fuel FROM fuel_mac_quants ORDER BY external_1_fuel'
  );
  const ext2ValuesResult = await db.executeQuery(
    'SELECT DISTINCT external_2_fuel FROM fuel_mac_quants ORDER BY external_2_fuel'
  );

  // Extract the values from the query results
  const tank1Values = tank1ValuesResult.results.map(r => r.data?.main_tank_1_fuel || 0);
  const tank2Values = tank2ValuesResult.results.map(r => r.data?.main_tank_2_fuel || 0);
  const tank3Values = tank3ValuesResult.results.map(r => r.data?.main_tank_3_fuel || 0);
  const tank4Values = tank4ValuesResult.results.map(r => r.data?.main_tank_4_fuel || 0);
  const ext1Values = ext1ValuesResult.results.map(r => r.data?.external_1_fuel || 0);
  const ext2Values = ext2ValuesResult.results.map(r => r.data?.external_2_fuel || 0);

  // Find the closest upper value for each tank
  const closestTank1 = findClosestUpperValue(tank1Values, tank1);
  const closestTank2 = findClosestUpperValue(tank2Values, tank2);
  const closestTank3 = findClosestUpperValue(tank3Values, tank3);
  const closestTank4 = findClosestUpperValue(tank4Values, tank4);
  const closestExt1 = findClosestUpperValue(ext1Values, ext1);
  const closestExt2 = findClosestUpperValue(ext2Values, ext2);

  // Query for the MAC contribution with these values
  const macQuantResult = await db.executeQuery(`
    SELECT mac_contribution
    FROM fuel_mac_quants
    WHERE main_tank_1_fuel = ? AND main_tank_2_fuel = ? 
    AND main_tank_3_fuel = ? AND main_tank_4_fuel = ?
    AND external_1_fuel = ? AND external_2_fuel = ?
  `, [closestTank1, closestTank2, closestTank3, closestTank4, closestExt1, closestExt2]);

  // If we found a match, return it
  if (macQuantResult.count > 0) {
    return { mac_contribution: macQuantResult.results[0].data?.mac_contribution || 0 };
  }

  throw new Error('No matching fuel configuration found');
}

/**
 * Helper function to find the closest value in an array that is >= the target value
 * If no value is >= target, returns the maximum value in the array
 */
function findClosestUpperValue(values: number[], target: number): number {
  // Filter values that are >= target
  const upperValues = values.filter(v => v >= target);

  if (upperValues.length === 0) {
    // If no upper values, return the maximum value in the array
    return Math.max(...values, 0);
  }

  // Return the minimum of the upper values (closest to target)
  return Math.min(...upperValues);
}
