/**
 * Database operations for fuel-related entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { FuelMacQuant } from './types';

// ============= FuelMacQuant Operations =============

/**
 * Create a new fuel MAC quantity entry
 */
export async function createFuelMacQuant(fuelMacQuant: FuelMacQuant): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO fuel_mac_quants (
      outboard_fuel, inboard_fuel, fuselage_fuel,
      auxiliary_fuel, external_fuel, mac_contribution
    )
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    fuelMacQuant.outboard_fuel,
    fuelMacQuant.inboard_fuel,
    fuelMacQuant.fuselage_fuel,
    fuelMacQuant.auxiliary_fuel,
    fuelMacQuant.external_fuel,
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
  outboard: number,
  inboard: number,
  fuselage: number,
  auxiliary: number,
  external: number
): Promise<{ mac_contribution: number }> {
  const db = await DatabaseFactory.getDatabase();

  // Get all distinct fuel quantities from the fuel_mac_quants table
  const outboardValuesResult = await db.executeQuery(
    'SELECT DISTINCT outboard_fuel FROM fuel_mac_quants ORDER BY outboard_fuel'
  );
  const inboardValuesResult = await db.executeQuery(
    'SELECT DISTINCT inboard_fuel FROM fuel_mac_quants ORDER BY inboard_fuel'
  );
  const fuselageValuesResult = await db.executeQuery(
    'SELECT DISTINCT fuselage_fuel FROM fuel_mac_quants ORDER BY fuselage_fuel'
  );
  const auxiliaryValuesResult = await db.executeQuery(
    'SELECT DISTINCT auxiliary_fuel FROM fuel_mac_quants ORDER BY auxiliary_fuel'
  );
  const externalValuesResult = await db.executeQuery(
    'SELECT DISTINCT external_fuel FROM fuel_mac_quants ORDER BY external_fuel'
  );

  // Extract the values from the query results
  const outboardValues = outboardValuesResult.results.map(r => r.data?.outboard_fuel || 0);
  const inboardValues = inboardValuesResult.results.map(r => r.data?.inboard_fuel || 0);
  const fuselageValues = fuselageValuesResult.results.map(r => r.data?.fuselage_fuel || 0);
  const auxiliaryValues = auxiliaryValuesResult.results.map(r => r.data?.auxiliary_fuel || 0);
  const externalValues = externalValuesResult.results.map(r => r.data?.external_fuel || 0);

  // Find the closest upper value for each tank
  const closestOutboard = findClosestUpperValue(outboardValues, outboard);
  const closestInboard = findClosestUpperValue(inboardValues, inboard);
  const closestFuselage = findClosestUpperValue(fuselageValues, fuselage);
  const closestAuxiliary = findClosestUpperValue(auxiliaryValues, auxiliary);
  const closestExternal = findClosestUpperValue(externalValues, external);

  // Query for the MAC contribution with these values
  const macQuantResult = await db.executeQuery(`
    SELECT mac_contribution
    FROM fuel_mac_quants
    WHERE outboard_fuel = ? AND inboard_fuel = ? 
    AND fuselage_fuel = ? AND auxiliary_fuel = ?
    AND external_fuel = ?
  `, [closestOutboard, closestInboard, closestFuselage, closestAuxiliary, closestExternal]);

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
