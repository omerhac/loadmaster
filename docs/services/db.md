# Database Service (@db)

## Overview

The Database Service provides a unified interface for SQLite database operations in the LoadMaster application. It supports both native database access for production and a test database implementation for testing environments.

## Core Interfaces

### DatabaseInterface

The primary interface for interacting with the database.

```typescript
interface DatabaseInterface {
  executeQuery(sql: string, params?: any[]): Promise<DatabaseResponse>;
  initializeSchema(sql: string): Promise<void>;
  executeTransaction(statements: SqlStatement[]): Promise<DatabaseResponse[]>;
}
```

## Usage

Import the database service to use in your application:

```typescript
import { DatabaseFactory } from '@/services/db';

async function example() {
  const db = await DatabaseFactory.getDatabase();
  const result = await db.executeQuery('SELECT * FROM users');
}
```

## Types

### Base Types

#### QueryResult
```typescript
interface QueryResult {
  data?: Record<string, any>;   // Row data for SELECT queries
  changes?: number;             // Number of rows affected for non-SELECT queries
  lastInsertId?: number;        // ID of the last inserted row for INSERT operations
}
```

#### DatabaseResponse
```typescript
interface DatabaseResponse {
  results: QueryResult[];       // Array of query results
  count: number;                // Total number of rows returned/affected
  error?: {                     // Error information if the query failed
    message: string;
    code?: string;
  };
}
```

#### SqlStatement
```typescript
interface SqlStatement {
  sql: string;                  // The SQL query to execute
  params?: any[];               // Parameter values to bind to the query
}
```

#### SchemaDefinition
```typescript
interface SchemaDefinition {
  tableName: string;            // Table name
  createStatement: string;      // SQL statement to create the table
}
```

### Entity Types

#### Aircraft
```typescript
interface Aircraft {
  id?: number;                       // Unique identifier (auto-generated)
  type: string;                      // Aircraft type
  name: string;                      // Aircraft name
  empty_weight: number;              // Empty weight in pounds
  empty_mac: number;                 // Empty MAC percentage
  cargo_bay_width: number;           // Width of cargo bay in inches
  treadways_width: number;           // Width of treadways in inches
  treadways_dist_from_center: number; // Distance from centerline to treadways
  ramp_length: number;               // Length of loading ramp in inches
  ramp_max_incline: number;          // Maximum ramp incline in degrees
  ramp_min_incline: number;          // Minimum ramp incline in degrees
}
```

#### Mission
```typescript
interface Mission {
  id?: number;                // Unique identifier (auto-generated)
  name: string;               // Mission name
  created_date: string;       // Date mission was created (ISO format)
  modified_date: string;      // Date mission was last modified (ISO format)
  total_weight: number;       // Total mission weight in pounds
  total_mac_percent: number;  // Total MAC percentage
  crew_weight: number;        // Weight of crew in pounds
  configuration_weights: number; // Weight of aircraft configuration items
  crew_gear_weight: number;   // Weight of crew gear in pounds
  food_weight: number;        // Weight of food in pounds
  safety_gear_weight: number; // Weight of safety gear in pounds
  etc_weight: number;         // Weight of other items in pounds
  aircraft_id: number;        // ID of aircraft used for this mission
}
```

#### CargoType
```typescript
interface CargoType {
  id?: number;                   // Unique identifier (auto-generated)
  user_id?: number;              // User who created this cargo type
  name: string;                  // Name of cargo type
  default_weight: number;        // Default weight in pounds
  default_length: number;        // Default length in inches
  default_width: number;         // Default width in inches
  default_height: number;        // Default height in inches
  default_forward_overhang: number; // Default forward overhang in inches
  default_back_overhang: number; // Default back overhang in inches
  type: 'bulk' | '2_wheeled' | '4_wheeled'; // Type of cargo
}
```

#### CargoItem
```typescript
interface CargoItem {
  id?: number;              // Unique identifier (auto-generated)
  mission_id: number;       // Mission this cargo belongs to
  cargo_type_id: number;    // Type of cargo
  name: string;             // Name of cargo item
  weight?: number;          // Weight in pounds
  length?: number;          // Length in inches
  width?: number;           // Width in inches
  height?: number;          // Height in inches
  forward_overhang?: number; // Forward overhang in inches
  back_overhang?: number;   // Back overhang in inches
  x_start_position: number; // Starting X position in cargo bay
  y_start_position: number; // Starting Y position in cargo bay
}
```

#### FuelState
```typescript
interface FuelState {
  id?: number;              // Unique identifier (auto-generated)
  mission_id: number;       // Mission this fuel state belongs to
  total_fuel: number;       // Total fuel in pounds
  main_tank_1_fuel: number; // Fuel in main tank 1 in pounds
  main_tank_2_fuel: number; // Fuel in main tank 2 in pounds
  main_tank_3_fuel: number; // Fuel in main tank 3 in pounds
  main_tank_4_fuel: number; // Fuel in main tank 4 in pounds
  external_1_fuel: number;  // Fuel in external tank 1 in pounds
  external_2_fuel: number;  // Fuel in external tank 2 in pounds
  mac_contribution: number; // MAC contribution from fuel
}
```

#### Compartment
```typescript
interface Compartment {
  id?: number;              // Unique identifier (auto-generated)
  aircraft_id: number;      // Aircraft this compartment belongs to
  name: string;             // Compartment name
  x_start: number;          // Starting X position in inches
  x_end: number;            // Ending X position in inches
  floor_area: number;       // Floor area in square inches
  usable_volume: number;    // Usable volume in cubic inches
}
```

#### LoadConstraint
```typescript
interface LoadConstraint {
  id?: number;             // Unique identifier (auto-generated)
  compartment_id: number;  // Compartment this constraint applies to
  constraint_type: string; // Type of constraint
  max_cumulative_weight?: number; // Maximum cumulative weight in pounds
  max_concentrated_load?: number; // Maximum concentrated load in pounds
  max_running_load_treadway?: number; // Maximum running load on treadway in pounds
  max_running_load_between_treadways?: number; // Maximum running load between treadways in pounds
}
```

#### User
```typescript
interface User {
  id?: number;        // Unique identifier (auto-generated)
  username: string;   // Username
  last_login?: string; // Last login date (ISO format)
}
```

#### AllowedMacConstraint
```typescript
interface AllowedMacConstraint {
  id?: number;                    // Unique identifier (auto-generated)
  gross_aircraft_weight: number;  // Gross aircraft weight in pounds
  min_mac: number;                // Minimum allowed MAC percentage
  max_mac: number;                // Maximum allowed MAC percentage
}
```

## Core Functions

### DatabaseFactory.getDatabase()
```typescript
static async getDatabase(): Promise<DatabaseInterface>
```
Returns a singleton instance of the appropriate database implementation based on the environment.

### executeQuery(sql, params)
```typescript
executeQuery(sql: string, params?: any[]): Promise<DatabaseResponse>
```
Executes a SQL query and returns the results in a standardized format.

### executeTransaction(statements)
```typescript
executeTransaction(statements: SqlStatement[]): Promise<DatabaseResponse[]>
```
Executes multiple SQL statements within a transaction.

### initializeSchema(sql)
```typescript
initializeSchema(sql: string): Promise<void>
```
Initializes the database schema with the provided SQL.

## Schema Management

### initializeLoadmasterDatabase()
```typescript
async function initializeLoadmasterDatabase(provided_db?: TestDatabaseService | null): Promise<void>
```
Creates the complete database schema for the LoadMaster application.

### generateSchemaSQL()
```typescript
function generateSchemaSQL(): string
```
Generates the complete SQL schema as a string.

### getSchemaDefinitions()
```typescript
function getSchemaDefinitions(): SchemaDefinition[]
```
Returns all schema definitions for the LoadMaster database.

## Database Operations

The database service includes specialized operation modules for different entities:

### Aircraft Operations

```typescript
// Create a new aircraft record
async function createAircraft(aircraft: Aircraft): Promise<DatabaseResponse>

// Retrieve an aircraft record by ID
async function getAircraftById(id: number): Promise<DatabaseResponse>

// Retrieve all aircraft records
async function getAllAircraft(): Promise<DatabaseResponse>

// Update an existing aircraft record
async function updateAircraft(aircraft: Aircraft): Promise<DatabaseResponse>

// Delete an aircraft record
async function deleteAircraft(id: number): Promise<DatabaseResponse>
```

### Mission Operations

```typescript
// Create a new mission
async function createMission(mission: Mission): Promise<DatabaseResponse>

// Retrieve a mission by ID
async function getMissionById(id: number): Promise<DatabaseResponse>

// Retrieve all missions
async function getAllMissions(): Promise<DatabaseResponse>

// Update an existing mission
async function updateMission(mission: Mission): Promise<DatabaseResponse>

// Delete a mission
async function deleteMission(id: number): Promise<DatabaseResponse>
```

### Cargo Type Operations

```typescript
// Create a new cargo type
async function createCargoType(cargoType: CargoType): Promise<DatabaseResponse>

// Retrieve a cargo type by ID
async function getCargoTypeById(id: number): Promise<DatabaseResponse>

// Retrieve all cargo types
async function getAllCargoTypes(): Promise<DatabaseResponse>

// Update an existing cargo type
async function updateCargoType(cargoType: CargoType): Promise<DatabaseResponse>

// Delete a cargo type
async function deleteCargoType(id: number): Promise<DatabaseResponse>
```

### Cargo Item Operations

```typescript
// Create a new cargo item
async function createCargoItem(cargoItem: CargoItem): Promise<DatabaseResponse>

// Retrieve cargo items for a specific mission
async function getCargoItemsByMissionId(missionId: number): Promise<DatabaseResponse>

// Update an existing cargo item
async function updateCargoItem(cargoItem: CargoItem): Promise<DatabaseResponse>

// Delete a cargo item
async function deleteCargoItem(id: number): Promise<DatabaseResponse>
```

### Fuel Operations

```typescript
// Create a new fuel state record
async function createFuelState(fuelState: FuelState): Promise<DatabaseResponse>

// Retrieve fuel state for a specific mission
async function getFuelStateByMissionId(missionId: number): Promise<DatabaseResponse>

// Update an existing fuel state
async function updateFuelState(fuelState: FuelState): Promise<DatabaseResponse>

// Delete a fuel state record
async function deleteFuelState(id: number): Promise<DatabaseResponse>

// Create a new fuel MAC quantity entry
async function createFuelMacQuant(fuelMacQuant: FuelMacQuant): Promise<DatabaseResponse>

// Retrieve all fuel MAC quantities
async function getAllFuelMacQuants(): Promise<DatabaseResponse>

// Find the closest matching fuel configuration in the reference table
async function findClosestFuelMacConfiguration(
  tank1: number,
  tank2: number,
  tank3: number,
  tank4: number,
  ext1: number,
  ext2: number
): Promise<{ mac_contribution: number }>
```

### Compartment Operations

```typescript
// Create a new compartment
async function createCompartment(compartment: Compartment): Promise<DatabaseResponse>

// Retrieve a compartment by ID
async function getCompartmentById(id: number): Promise<DatabaseResponse>

// Retrieve compartments for a specific aircraft
async function getCompartmentsByAircraftId(aircraftId: number): Promise<DatabaseResponse>

// Update an existing compartment
async function updateCompartment(compartment: Compartment): Promise<DatabaseResponse>

// Delete a compartment
async function deleteCompartment(id: number): Promise<DatabaseResponse>
```

### User Operations

```typescript
// Create a new user
async function createUser(user: User): Promise<DatabaseResponse>

// Retrieve a user by ID
async function getUserById(id: number): Promise<DatabaseResponse>

// Retrieve all users
async function getAllUsers(): Promise<DatabaseResponse>

// Update an existing user
async function updateUser(user: User): Promise<DatabaseResponse>

// Delete a user
async function deleteUser(id: number): Promise<DatabaseResponse>
```

### Allowed MAC Constraint Operations

```typescript
// Create a new MAC constraint
async function createAllowedMacConstraint(constraint: AllowedMacConstraint): Promise<DatabaseResponse>

// Retrieve all allowed MAC constraints
async function getAllowedMacConstraints(): Promise<DatabaseResponse>

// Update an existing MAC constraint
async function updateAllowedMacConstraint(constraint: AllowedMacConstraint): Promise<DatabaseResponse>

// Delete a MAC constraint
async function deleteAllowedMacConstraint(id: number): Promise<DatabaseResponse>
```