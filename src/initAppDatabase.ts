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

export default async function initAppDatabase() {
    const allAircraft = await getAllAircraft();
    if (allAircraft.count > 0) {
        // Database already initialized
        console.log('Database already initialized');
        return;
    }

    await initializeLoadmasterDatabase();
    const aircraft: Aircraft = {
        type: 'C-130',
        name: 'Hercules',
        empty_weight: 75000,
        empty_mac: 84,
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
        type: 'bulk' as const,
    };
    const cargoTypeResult = await createCargoType(defaultCargoType);
    const defaultCargoTypeId = cargoTypeResult.results[0].lastInsertId;

    const defaultMission: Mission = {
        name: 'Default Mission',
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        front_crew_weight: 500,
        back_crew_weight: 500,
        configuration_weights: 500,
        crew_gear_weight: 300,
        food_weight: 200,
        safety_gear_weight: 150,
        etc_weight: 100,
        outboard_fuel: 1000,
        inboard_fuel: 2000,
        fuselage_fuel: 1500,
        auxiliary_fuel: 500,
        external_fuel: 800,
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
