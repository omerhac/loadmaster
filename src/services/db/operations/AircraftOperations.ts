/**
 * Database operations for Aircraft entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { Aircraft } from './types';

/**
 * Create a new aircraft
 */
export async function createAircraft(aircraft: Aircraft): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO aircraft (
      type, name, empty_weight, empty_mac, cargo_bay_width,
      treadways_width, treadways_dist_from_center, ramp_length,
      ramp_max_incline, ramp_min_incline
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    aircraft.type,
    aircraft.name,
    aircraft.empty_weight,
    aircraft.empty_mac,
    aircraft.cargo_bay_width,
    aircraft.treadways_width,
    aircraft.treadways_dist_from_center,
    aircraft.ramp_length,
    aircraft.ramp_max_incline,
    aircraft.ramp_min_incline,
  ]);
}

/**
 * Get aircraft by ID
 */
export async function getAircraftById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM aircraft WHERE id = ?;', [id]);
}

/**
 * Get all aircraft
 */
export async function getAllAircraft(): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM aircraft;');
}

/**
 * Update aircraft
 */
export async function updateAircraft(aircraft: Aircraft): Promise<DatabaseResponse> {
  if (!aircraft.id) {
    throw new Error('Aircraft ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE aircraft
    SET type = ?, name = ?, empty_weight = ?, empty_mac = ?, 
        cargo_bay_width = ?, treadways_width = ?, treadways_dist_from_center = ?,
        ramp_length = ?, ramp_max_incline = ?, ramp_min_incline = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    aircraft.type,
    aircraft.name,
    aircraft.empty_weight,
    aircraft.empty_mac,
    aircraft.cargo_bay_width,
    aircraft.treadways_width,
    aircraft.treadways_dist_from_center,
    aircraft.ramp_length,
    aircraft.ramp_max_incline,
    aircraft.ramp_min_incline,
    aircraft.id,
  ]);
}

/**
 * Delete aircraft
 */
export async function deleteAircraft(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM aircraft WHERE id = ?;', [id]);
} 