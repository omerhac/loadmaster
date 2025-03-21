/**
 * Database CRUD operations for the LoadMaster application
 */

import { DatabaseFactory } from './DatabaseService';
import { DatabaseResponse } from './DatabaseTypes';

// Entity Interfaces
export interface Aircraft {
  id?: number;
  type: string;
  name: string;
  empty_weight: number;
  empty_mac: number;
  cargo_bay_width: number;
  treadways_width: number;
  treadways_dist_from_center: number;
  ramp_length: number;
  ramp_max_incline: number;
  ramp_min_incline: number;
}

export interface Mission {
  id?: number;
  name: string;
  created_date: string;
  modified_date: string;
  total_weight: number;
  total_mac_percent: number;
  aircraft_id: number;
}

export interface CargoType {
  id?: number;
  user_id?: number;
  name: string;
  default_weight: number;
  default_length: number;
  default_width: number;
  default_height: number;
  default_forward_overhang: number;
  default_back_overhang: number;
  type: 'bulk' | '2_wheeled' | '4_wheeled';
}

export interface CargoItem {
  id?: number;
  mission_id: number;
  cargo_type_id: number;
  name: string;
  x_start_position: number;
  y_start_position: number;
}

export interface FuelState {
  id?: number;
  mission_id: number;
  total_fuel: number;
  main_tank_1_fuel: number;
  main_tank_2_fuel: number;
  main_tank_3_fuel: number;
  main_tank_4_fuel: number;
  external_1_fuel: number;
  external_2_fuel: number;
  mac_contribution: number;
}

export interface FuelMacQuant {
  id?: number;
  main_tank_1_fuel: number;
  main_tank_2_fuel: number;
  main_tank_3_fuel: number;
  main_tank_4_fuel: number;
  external_1_fuel: number;
  external_2_fuel: number;
  mac_contribution: number;
}

export interface Compartment {
  id?: number;
  aircraft_id: number;
  name: string;
  x_start: number;
  x_end: number;
  floor_area: number;
  usable_volume: number;
}

export interface LoadConstraint {
  id?: number;
  compartment_id: number;
  constraint_type: string;
  max_cumulative_weight?: number;
  max_concentrated_load?: number;
  max_running_load_treadway?: number;
  max_running_load_between_treadways?: number;
}

export interface User {
  id?: number;
  username: string;
  last_login?: string;
}

// ============= User Operations =============

/**
 * Create a new user
 */
export async function createUser(user: User): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO user (username, last_login)
    VALUES (?, ?);
  `;
  return db.executeQuery(sql, [user.username, user.last_login || null]);
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM user WHERE id = ?;', [id]);
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM user WHERE username = ?;', [username]);
}

/**
 * Update user
 */
export async function updateUser(user: User): Promise<DatabaseResponse> {
  if (!user.id) {
    throw new Error('User ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE user
    SET username = ?, last_login = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [user.username, user.last_login || null, user.id]);
}

/**
 * Delete user
 */
export async function deleteUser(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM user WHERE id = ?;', [id]);
}

// ============= Aircraft Operations =============

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

// ============= Mission Operations =============

/**
 * Create a new mission
 */
export async function createMission(mission: Mission): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO mission (
      name, created_date, modified_date, total_weight,
      total_mac_percent, aircraft_id
    )
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    mission.name,
    mission.created_date,
    mission.modified_date,
    mission.total_weight,
    mission.total_mac_percent,
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
    SET name = ?, modified_date = ?, total_weight = ?,
        total_mac_percent = ?, aircraft_id = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    mission.name,
    mission.modified_date,
    mission.total_weight,
    mission.total_mac_percent,
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

// ============= CargoType Operations =============

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

// ============= CargoItem Operations =============

/**
 * Create a new cargo item
 */
export async function createCargoItem(cargoItem: CargoItem): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO cargo_item (
      mission_id, cargo_type_id, name, x_start_position, y_start_position
    )
    VALUES (?, ?, ?, ?, ?);
  `;
  return db.executeQuery(sql, [
    cargoItem.mission_id,
    cargoItem.cargo_type_id,
    cargoItem.name,
    cargoItem.x_start_position,
    cargoItem.y_start_position,
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
        x_start_position = ?, y_start_position = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [
    cargoItem.mission_id,
    cargoItem.cargo_type_id,
    cargoItem.name,
    cargoItem.x_start_position,
    cargoItem.y_start_position,
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

// ============= Compartment Operations =============

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
