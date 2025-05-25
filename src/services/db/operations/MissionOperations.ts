/**
 * Database operations for Mission entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { Mission } from './types';

/**
 * Create a new mission
 */
export async function createMission(mission: Mission): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO mission (
      name, created_date, modified_date, front_crew_weight, back_crew_weight,
      configuration_weights, crew_gear_weight, food_weight,
      safety_gear_weight, etc_weight, outboard_fuel, inboard_fuel,
      fuselage_fuel, auxiliary_fuel, external_fuel, aircraft_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    mission.name,
    mission.created_date,
    mission.modified_date,
    mission.front_crew_weight,
    mission.back_crew_weight,
    mission.configuration_weights,
    mission.crew_gear_weight,
    mission.food_weight,
    mission.safety_gear_weight,
    mission.etc_weight,
    mission.outboard_fuel,
    mission.inboard_fuel,
    mission.fuselage_fuel,
    mission.auxiliary_fuel,
    mission.external_fuel,
    mission.aircraft_id,
  ]);
}

/**
 * Get mission by ID
 */
export async function getMissionById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM mission WHERE id = ?;', [id]);
}

/**
 * Get all missions
 */
export async function getAllMissions(): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM mission;');
}

/**
 * Get missions by aircraft ID
 */
export async function getMissionsByAircraftId(aircraftId: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM mission WHERE aircraft_id = ?;', [aircraftId]);
}

/**
 * Update mission
 */
export async function updateMission(mission: Mission): Promise<DatabaseResponse> {
  if (!mission.id) {
    throw new Error('Mission ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE mission
    SET name = ?, modified_date = ?,
        front_crew_weight = ?, back_crew_weight = ?, configuration_weights = ?,
        crew_gear_weight = ?, food_weight = ?, safety_gear_weight = ?,
        etc_weight = ?, outboard_fuel = ?, inboard_fuel = ?,
        fuselage_fuel = ?, auxiliary_fuel = ?, external_fuel = ?, aircraft_id = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    mission.name,
    mission.modified_date,
    mission.front_crew_weight,
    mission.back_crew_weight,
    mission.configuration_weights,
    mission.crew_gear_weight,
    mission.food_weight,
    mission.safety_gear_weight,
    mission.etc_weight,
    mission.outboard_fuel,
    mission.inboard_fuel,
    mission.fuselage_fuel,
    mission.auxiliary_fuel,
    mission.external_fuel,
    mission.aircraft_id,
    mission.id,
  ]);
}

/**
 * Delete mission
 */
export async function deleteMission(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM mission WHERE id = ?;', [id]);
}
