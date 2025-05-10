/**
 * Database operations for CargoItem entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { CargoItem } from './types';

/**
 * Create a new cargo item
 */
export async function createCargoItem(cargoItem: CargoItem): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();

  // First, get the cargo type to retrieve default values
  const getCargoTypeQuery = `
    SELECT * FROM cargo_type WHERE id = ?;
  `;
  const cargoTypeResult = await db.executeQuery(getCargoTypeQuery, [cargoItem.cargo_type_id]);

  if (cargoTypeResult.count === 0) {
    throw new Error(`Cargo type with id ${cargoItem.cargo_type_id} not found`);
  }

  const cargoType = cargoTypeResult.results[0].data;

  const sql = `
    INSERT INTO cargo_item (
      mission_id, cargo_type_id, name, weight, length, width, height, 
      forward_overhang, back_overhang, cog, x_start_position, y_start_position, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  return db.executeQuery(sql, [
    cargoItem.mission_id,
    cargoItem.cargo_type_id,
    cargoItem.name,
    cargoItem.weight || cargoType?.default_weight,
    cargoItem.length || cargoType?.default_length,
    cargoItem.width || cargoType?.default_width,
    cargoItem.height || cargoType?.default_height,
    cargoItem.forward_overhang || cargoType?.default_forward_overhang,
    cargoItem.back_overhang || cargoType?.default_back_overhang,
    cargoItem.cog || cargoType?.default_cog,
    cargoItem.x_start_position,
    cargoItem.y_start_position,
    cargoItem.status || 'inventory',
  ]);
}

/**
 * Get cargo item by ID
 */
export async function getCargoItemById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM cargo_item WHERE id = ?;', [id]);
}

/**
 * Get cargo items by mission ID
 */
export async function getCargoItemsByMissionId(missionId: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM cargo_item WHERE mission_id = ?;', [missionId]);
}

/**
 * Update cargo item
 */
export async function updateCargoItem(cargoItem: CargoItem): Promise<DatabaseResponse> {
  if (!cargoItem.id) {
    throw new Error('Cargo item ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE cargo_item
    SET mission_id = ?, cargo_type_id = ?, name = ?,
        weight = ?, length = ?, width = ?, height = ?,
        forward_overhang = ?, back_overhang = ?, cog = ?,
        x_start_position = ?, y_start_position = ?, status = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    cargoItem.mission_id,
    cargoItem.cargo_type_id,
    cargoItem.name,
    cargoItem.weight,
    cargoItem.length,
    cargoItem.width,
    cargoItem.height,
    cargoItem.forward_overhang,
    cargoItem.back_overhang,
    cargoItem.cog || 0,
    cargoItem.x_start_position,
    cargoItem.y_start_position,
    cargoItem.status || 'inventory',
    cargoItem.id,
  ]);
}

/**
 * Delete cargo item
 */
export async function deleteCargoItem(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM cargo_item WHERE id = ?;', [id]);
}
