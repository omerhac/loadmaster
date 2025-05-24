/**
 * Schema creation and initialization functions for the LoadMaster application database
 */

import { SchemaDefinition } from './DatabaseTypes';
import { DatabaseFactory } from './DatabaseService';
import { TestDatabaseService } from './TestDatabaseService';
/**
 * Creates the complete database schema for the LoadMaster application
 */
export async function initializeLoadmasterDatabase(provided_db: TestDatabaseService | null = null): Promise<void> {
  if (provided_db) {
    await provided_db.initializeSchema(generateSchemaSQL());
  } else {
    const db = await DatabaseFactory.getDatabase();
    await db.initializeSchema(generateSchemaSQL());
  }
}

/**
 * Generate the complete SQL schema as a string
 */
export function generateSchemaSQL(): string {
  const schemas = getSchemaDefinitions();
  return schemas.map(schema => schema.createStatement).join('\n\n');
}

/**
 * Returns all schema definitions for the LoadMaster database
 */
export function getSchemaDefinitions(): SchemaDefinition[] {
  return [
    getUserTableSchema(),
    getAircraftTableSchema(),
    getMissionTableSchema(),
    getCargoTypeTableSchema(),
    getCargoItemTableSchema(),
    getFuelMacQuantsTableSchema(),
    getCompartmentTableSchema(),
    getLoadConstraintsTableSchema(),
    getAllowedMacConstraintsTableSchema(),
  ];
}

/**
 * User table schema definition
 */
export function getUserTableSchema(): SchemaDefinition {
  return {
    tableName: 'user',
    createStatement: `
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        last_login TEXT
      );
    `,
  };
}

/**
 * Aircraft table schema definition
 */
export function getAircraftTableSchema(): SchemaDefinition {
  return {
    tableName: 'aircraft',
    createStatement: `
      CREATE TABLE IF NOT EXISTS aircraft (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        empty_weight REAL NOT NULL,
        empty_mac REAL NOT NULL,
        cargo_bay_width REAL NOT NULL,
        treadways_width REAL NOT NULL,
        treadways_dist_from_center REAL NOT NULL,
        ramp_length REAL NOT NULL,
        ramp_max_incline REAL NOT NULL,
        ramp_min_incline REAL NOT NULL
      );
    `,
  };
}

/**
 * Mission table schema definition
 */
export function getMissionTableSchema(): SchemaDefinition {
  return {
    tableName: 'mission',
    createStatement: `
      CREATE TABLE IF NOT EXISTS mission (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_date TEXT NOT NULL,
        modified_date TEXT NOT NULL,
        front_crew_weight REAL NOT NULL DEFAULT 0,
        back_crew_weight REAL NOT NULL DEFAULT 0,
        configuration_weights REAL NOT NULL DEFAULT 0,
        crew_gear_weight REAL NOT NULL DEFAULT 0,
        food_weight REAL NOT NULL DEFAULT 0,
        safety_gear_weight REAL NOT NULL DEFAULT 0,
        etc_weight REAL NOT NULL DEFAULT 0,
        outboard_fuel REAL NOT NULL DEFAULT 0,
        inboard_fuel REAL NOT NULL DEFAULT 0,
        fuselage_fuel REAL NOT NULL DEFAULT 0,
        auxiliary_fuel REAL NOT NULL DEFAULT 0,
        external_fuel REAL NOT NULL DEFAULT 0,
        aircraft_id INTEGER NOT NULL,
        FOREIGN KEY (aircraft_id) REFERENCES aircraft (id)
      );
    `,
  };
}

/**
 * Cargo type table schema definition
 */
export function getCargoTypeTableSchema(): SchemaDefinition {
  return {
    tableName: 'cargo_type',
    createStatement: `
      CREATE TABLE IF NOT EXISTS cargo_type (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        default_weight REAL NOT NULL,
        default_length REAL NOT NULL,
        default_width REAL NOT NULL,
        default_height REAL NOT NULL,
        default_forward_overhang REAL NOT NULL,
        default_back_overhang REAL NOT NULL,
        default_cog REAL NOT NULL,
        type TEXT CHECK (type IN ('bulk', '2_wheeled', '4_wheeled')) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user (id)
      );
    `,
  };
}

/**
 * Cargo item table schema definition
 */
export function getCargoItemTableSchema(): SchemaDefinition {
  return {
    tableName: 'cargo_item',
    createStatement: `
      CREATE TABLE IF NOT EXISTS cargo_item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER NOT NULL,
        cargo_type_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        weight REAL NOT NULL,
        length REAL NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        forward_overhang REAL NOT NULL,
        back_overhang REAL NOT NULL,
        cog REAL NOT NULL,
        x_start_position REAL NOT NULL,
        y_start_position REAL NOT NULL,
        status TEXT CHECK (status IN ('inventory', 'onStage', 'onDeck')) NOT NULL,
        FOREIGN KEY (mission_id) REFERENCES mission (id),
        FOREIGN KEY (cargo_type_id) REFERENCES cargo_type (id)
      );
    `,
  };
}

/**
 * Fuel MAC quantities table schema definition
 */
export function getFuelMacQuantsTableSchema(): SchemaDefinition {
  return {
    tableName: 'fuel_mac_quants',
    createStatement: `
      CREATE TABLE IF NOT EXISTS fuel_mac_quants (
        outboard_fuel REAL NOT NULL,
        inboard_fuel REAL NOT NULL,
        fuselage_fuel REAL NOT NULL,
        auxiliary_fuel REAL NOT NULL,
        external_fuel REAL NOT NULL,
        mac_contribution REAL NOT NULL
      );
    `,
  };
}

/**
 * Compartment table schema definition
 */
export function getCompartmentTableSchema(): SchemaDefinition {
  return {
    tableName: 'compartment',
    createStatement: `
      CREATE TABLE IF NOT EXISTS compartment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aircraft_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        x_start REAL NOT NULL,
        x_end REAL NOT NULL,
        floor_area REAL NOT NULL,
        usable_volume REAL NOT NULL,
        FOREIGN KEY (aircraft_id) REFERENCES aircraft (id)
      );
    `,
  };
}

/**
 * Load constraints table schema definition
 */
export function getLoadConstraintsTableSchema(): SchemaDefinition {
  return {
    tableName: 'load_constraints',
    createStatement: `
      CREATE TABLE IF NOT EXISTS load_constraints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        compartment_id INTEGER NOT NULL,
        max_cumulative_weight REAL,
        max_concentrated_load REAL,
        max_running_load_treadway REAL,
        max_running_load_between_treadways REAL,
        FOREIGN KEY (compartment_id) REFERENCES compartment (id)
      );
    `,
  };
}

/**
 * Allowed MAC constraints table schema definition
 */
export function getAllowedMacConstraintsTableSchema(): SchemaDefinition {
  return {
    tableName: 'allowed_mac_constraints',
    createStatement: `
      CREATE TABLE IF NOT EXISTS allowed_mac_constraints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gross_aircraft_weight REAL NOT NULL,
        min_mac REAL NOT NULL,
        max_mac REAL NOT NULL
      );
    `,
  };
}
