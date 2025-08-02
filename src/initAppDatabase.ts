/**
 * Initialize the app database
 * Initialize the database schema and load read-only data
 */

import { createAircraft } from './services/db/operations/AircraftOperations';
import { createCargoItem } from './services/db/operations/CargoItemOperations';
import { createCargoType } from './services/db/operations/CargoTypeOperations';
import { createMission } from './services/db/operations/MissionOperations';
import { Aircraft, CargoItem, Mission } from './services/db/operations/types';
import { initializeLoadmasterDatabase } from './services/db/SchemaService';
import { getAllCargoTypes } from './services/db/operations/CargoTypeOperations';
import { getAllAircraft } from './services/db/operations/AircraftOperations';
import { createAllowedMacConstraint, getAllAllowedMacConstraints } from './services/db/operations/AllowedMacConstraintOperations';
import { MAC_CONSTRAINTS_DATA } from './data/macConstraints';

export default async function initAppDatabase() {
    try {
        const allAircraft = await getAllAircraft();
        if (allAircraft.count > 0) {
            // Database already initialized
            console.log('Database already initialized');
            return;
        }
    } catch (error) {
        console.log('Error checking existing aircraft (database may not be initialized yet):', error);
    }

    try {
        console.log('Initializing database schemas...');
        await initializeLoadmasterDatabase();
        console.log('Database schemas initialized successfully');

        // Verify tables were created
        const { DatabaseFactory } = require('./services/db/DatabaseService');
        const db = await DatabaseFactory.getDatabase();
        const tablesResult = await db.executeQuery("SELECT name FROM sqlite_master WHERE type='table';");
        const tableNames = tablesResult.results.map(result => result.data?.name).filter(Boolean);
        console.log('Created tables:', tableNames);

        if (tableNames.length === 0) {
            throw new Error('No tables were created during schema initialization');
        }
    } catch (error) {
        console.error('Error initializing database schemas:', error);
        throw error;
    }

    // Insert MAC constraints data
    try {
        const existingConstraints = await getAllAllowedMacConstraints();
        if (existingConstraints.count === 0) {
            console.log('Inserting MAC constraints data...');
            for (const constraint of MAC_CONSTRAINTS_DATA) {
                await createAllowedMacConstraint(constraint);
            }
            console.log(`Successfully inserted ${MAC_CONSTRAINTS_DATA.length} MAC constraints`);
        } else {
            console.log('MAC constraints already exist in database');
        }
    } catch (error) {
        console.error('Error inserting MAC constraints:', error);
        // Continue with initialization even if MAC constraints fail
    }

    const aircraft: Aircraft = {
        type: 'C-130',
        name: 'Hercules',
        empty_weight: 83288,
        empty_mac: 84.3,
        cargo_bay_width: 10,
        treadways_width: 2,
        treadways_dist_from_center: 1,
        ramp_length: 10,
        ramp_max_incline: 15,
        ramp_min_incline: 5,
    };
    const aircraftResult = await createAircraft(aircraft);
    const aircraftId = aircraftResult.results[0].lastInsertId;

    const defaultCargoType = {
        name: 'Standard Pallet',
        default_weight: 2000,
        default_length: 108,
        default_width: 88,
        default_height: 96,
        default_forward_overhang: 0,
        default_back_overhang: 0,
        default_cog: 54,
        type: 'bulk' as const,
    };
    const cargoTypeResult = await createCargoType(defaultCargoType);
    const defaultCargoTypeId = cargoTypeResult.results[0].lastInsertId;

    const defaultMission: Mission = {
        name: 'Default Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        loadmasters: 6,
        loadmasters_fs: 239.34,
        configuration_weights: 0,
        crew_gear_weight: 0,
        food_weight: 0,
        safety_gear_weight: 250,
        etc_weight: 637,
        outboard_fuel: 16000,
        inboard_fuel: 15000,
        fuselage_fuel: 0,
        auxiliary_fuel: 4000,
        external_fuel: 0,
        aircraft_id: aircraftId as number,
    };
    const missionResult = await createMission(defaultMission);
    const defaultMissionId = missionResult.results[0].lastInsertId;
    console.log('Default Mission ID:', defaultMissionId);


    const defaultCargoItem: CargoItem = {
        name: 'Default Cargo Item',
        weight: 1000,
        length: 108,
        width: 88,
        height: 96,
        forward_overhang: 0,
        back_overhang: 0,
        x_start_position: 0,
        y_start_position: 0,
        mission_id: defaultMissionId as number,
        cargo_type_id: defaultCargoTypeId as number,
        status: 'inventory',
    };
    await createCargoItem(defaultCargoItem);

    const cargoTypes = await getAllCargoTypes();
    console.log('Cargo Types:', cargoTypes);
}
