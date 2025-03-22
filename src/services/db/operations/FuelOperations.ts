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