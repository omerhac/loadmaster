/**
 * Database operations for AllowedMacConstraint entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { AllowedMacConstraint } from './types';

/**
 * Create a new allowed MAC constraint
 */
export async function createAllowedMacConstraint(
  constraint: AllowedMacConstraint
): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO allowed_mac_constraints (
      gross_aircraft_weight, min_mac, max_mac
    )
    VALUES (?, ?, ?);
  `;
  return db.executeQuery(sql, [
    constraint.gross_aircraft_weight,
    constraint.min_mac,
    constraint.max_mac,
  ]);
}

/**
 * Get allowed MAC constraint by ID
 */
export async function getAllowedMacConstraintById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM allowed_mac_constraints WHERE id = ?;', [id]);
}

/**
 * Get all allowed MAC constraints
 */
export async function getAllAllowedMacConstraints(): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM allowed_mac_constraints ORDER BY gross_aircraft_weight;');
}

/**
 * Get allowed MAC constraints for a specific gross aircraft weight
 * If exact weight not found:
 * 1. First tries to find the closest constraint ABOVE the specified weight
 * 2. If no constraint exists above the weight, returns the closest constraint below
 */
export async function getAllowedMacConstraintByWeight(
  weight: number
): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();

  // First try to get constraints with weight >= requested weight (get the lowest one)
  const upperConstraint = await db.executeQuery(
    'SELECT * FROM allowed_mac_constraints WHERE gross_aircraft_weight >= ? ORDER BY gross_aircraft_weight ASC LIMIT 1;',
    [weight]
  );

  // If no upper constraint found, get the highest one that's less than the requested weight
  if (upperConstraint.count === 0) {
    return db.executeQuery(
      'SELECT * FROM allowed_mac_constraints WHERE gross_aircraft_weight < ? ORDER BY gross_aircraft_weight DESC LIMIT 1;',
      [weight]
    );
  }

  return upperConstraint;
}

/**
 * Update an allowed MAC constraint
 */
export async function updateAllowedMacConstraint(
  constraint: AllowedMacConstraint
): Promise<DatabaseResponse> {
  if (!constraint.id) {
    throw new Error('Constraint ID is required for update operation');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE allowed_mac_constraints
    SET gross_aircraft_weight = ?, min_mac = ?, max_mac = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    constraint.gross_aircraft_weight,
    constraint.min_mac,
    constraint.max_mac,
    constraint.id,
  ]);
}

/**
 * Delete an allowed MAC constraint
 */
export async function deleteAllowedMacConstraint(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM allowed_mac_constraints WHERE id = ?;', [id]);
}
