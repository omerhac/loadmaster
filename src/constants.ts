import { Mission } from './services/db/operations/types';

export const DEFAULT_Y_POS = 100;
export const DEFAULT_CARGO_TYPE_ID = 1;
export const DEFAULT_MISSION_ID = 1;
export const DEFAULT_AIRCRAFT_ID = 1;

// Mission settings
export const DEFAULT_LOADMASTERS = 6;
export const DEFAULT_LOADMASTERS_FS = 239.34;
export const DEFAULT_CONFIGURATION_WEIGHTS = 0;
export const DEFAULT_CREW_GEAR_WEIGHT = 0;
export const DEFAULT_FOOD_WEIGHT = 0;
export const DEFAULT_SAFETY_GEAR_WEIGHT = 250;
export const DEFAULT_ETC_WEIGHT = 637;
export const DEFAULT_OUTBOARD_FUEL = 16000;
export const DEFAULT_INBOARD_FUEL = 15000;
export const DEFAULT_FUSELAGE_FUEL = 0;
export const DEFAULT_AUXILIARY_FUEL = 4000;
export const DEFAULT_EXTERNAL_FUEL = 0;
export const DEFAULT_LOADMASTER_WEIGHT = 170;
export const DEFAULT_NEW_MISSION: Mission = {
  id: DEFAULT_MISSION_ID,
  name: 'New Mission',
  created_date: new Date().toISOString(),
  modified_date: new Date().toISOString(),
  loadmasters: DEFAULT_LOADMASTERS,
  loadmasters_fs: DEFAULT_LOADMASTERS_FS,
  configuration_weights: DEFAULT_CONFIGURATION_WEIGHTS,
  crew_gear_weight: DEFAULT_CREW_GEAR_WEIGHT,
  food_weight: DEFAULT_FOOD_WEIGHT,
  safety_gear_weight: DEFAULT_SAFETY_GEAR_WEIGHT,
  etc_weight: DEFAULT_ETC_WEIGHT,
  outboard_fuel: DEFAULT_OUTBOARD_FUEL,
  inboard_fuel: DEFAULT_INBOARD_FUEL,
  fuselage_fuel: DEFAULT_FUSELAGE_FUEL,
  auxiliary_fuel: DEFAULT_AUXILIARY_FUEL,
  external_fuel: DEFAULT_EXTERNAL_FUEL,
  aircraft_id: DEFAULT_AIRCRAFT_ID,
};
