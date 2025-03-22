/**
 * Database operations for Compartment entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { Compartment, LoadConstraint } from './types';

/**
 * Create a new compartment
 */
export async function createCompartment(compartment: Compartment): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO compartment (
      aircraft_id, name, x_start, x_end, floor_area, usable_volume
    )
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    compartment.aircraft_id,
    compartment.name,
    compartment.x_start,
    compartment.x_end,
    compartment.floor_area,
    compartment.usable_volume,
  ]);
}

/**
 * Get compartment by ID
 */
export async function getCompartmentById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM compartment WHERE id = ?;', [id]);
}

/**
 * Get compartments by aircraft ID
 */
export async function getCompartmentsByAircraftId(aircraftId: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM compartment WHERE aircraft_id = ?;', [aircraftId]);
}

/**
 * Update compartment
 */
export async function updateCompartment(compartment: Compartment): Promise<DatabaseResponse> {
  if (!compartment.id) {
    throw new Error('Compartment ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE compartment
    SET aircraft_id = ?, name = ?, x_start = ?, x_end = ?,
        floor_area = ?, usable_volume = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    compartment.aircraft_id,
    compartment.name,
    compartment.x_start,
    compartment.x_end,
    compartment.floor_area,
    compartment.usable_volume,
    compartment.id,
  ]);
}

/**
 * Delete compartment
 */
export async function deleteCompartment(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM compartment WHERE id = ?;', [id]);
}

// ============= LoadConstraint Operations =============

/**
 * Create a new load constraint
 */
export async function createLoadConstraint(loadConstraint: LoadConstraint): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO load_constraints (
      compartment_id, constraint_type, max_cumulative_weight,
      max_concentrated_load, max_running_load_treadway,
      max_running_load_between_treadways
    )
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    loadConstraint.compartment_id,
    loadConstraint.constraint_type,
    loadConstraint.max_cumulative_weight || null,
    loadConstraint.max_concentrated_load || null,
    loadConstraint.max_running_load_treadway || null,
    loadConstraint.max_running_load_between_treadways || null,
  ]);
}

/**
 * Get load constraints by compartment ID
 */
export async function getLoadConstraintsByCompartmentId(compartmentId: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM load_constraints WHERE compartment_id = ?;', [compartmentId]);
}

/**
 * Update load constraint
 */
export async function updateLoadConstraint(loadConstraint: LoadConstraint): Promise<DatabaseResponse> {
  if (!loadConstraint.id) {
    throw new Error('Load constraint ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE load_constraints
    SET compartment_id = ?, constraint_type = ?, max_cumulative_weight = ?,
        max_concentrated_load = ?, max_running_load_treadway = ?,
        max_running_load_between_treadways = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    loadConstraint.compartment_id,
    loadConstraint.constraint_type,
    loadConstraint.max_cumulative_weight || null,
    loadConstraint.max_concentrated_load || null,
    loadConstraint.max_running_load_treadway || null,
    loadConstraint.max_running_load_between_treadways || null,
    loadConstraint.id,
  ]);
}

/**
 * Delete load constraint
 */
export async function deleteLoadConstraint(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM load_constraints WHERE id = ?;', [id]);
}
