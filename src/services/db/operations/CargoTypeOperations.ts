/**
 * Database operations for CargoType entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { CargoType } from './types';

/**
 * Create a new cargo type
 */
export async function createCargoType(cargoType: CargoType): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO cargo_type (
      user_id, name, default_weight, default_length, default_width,
      default_height, default_forward_overhang, default_back_overhang, type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    cargoType.user_id || null,
    cargoType.name,
    cargoType.default_weight,
    cargoType.default_length,
    cargoType.default_width,
    cargoType.default_height,
    cargoType.default_forward_overhang,
    cargoType.default_back_overhang,
    cargoType.type,
  ]);
}

/**
 * Get cargo type by ID
 */
export async function getCargoTypeById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM cargo_type WHERE id = ?;', [id]);
}

/**
 * Get all cargo types
 */
export async function getAllCargoTypes(): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM cargo_type;');
}

/**
 * Get cargo types by user ID
 */
export async function getCargoTypesByUserId(userId: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM cargo_type WHERE user_id = ?;', [userId]);
}

/**
 * Update cargo type
 */
export async function updateCargoType(cargoType: CargoType): Promise<DatabaseResponse> {
  if (!cargoType.id) {
    throw new Error('Cargo type ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE cargo_type
    SET user_id = ?, name = ?, default_weight = ?, default_length = ?,
        default_width = ?, default_height = ?, default_forward_overhang = ?,
        default_back_overhang = ?, type = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    cargoType.user_id || null,
    cargoType.name,
    cargoType.default_weight,
    cargoType.default_length,
    cargoType.default_width,
    cargoType.default_height,
    cargoType.default_forward_overhang,
    cargoType.default_back_overhang,
    cargoType.type,
    cargoType.id,
  ]);
}

/**
 * Delete cargo type
 */
export async function deleteCargoType(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM cargo_type WHERE id = ?;', [id]);
} 