/**
 * Database entity type definitions
 */

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
  crew_weight: number;
  configuration_weights: number;
  crew_gear_weight: number;
  food_weight: number;
  safety_gear_weight: number;
  etc_weight: number;
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
  default_cog?: number;
  type: 'bulk' | '2_wheeled' | '4_wheeled';
}

export interface CargoItem {
  id?: number;
  mission_id: number;
  cargo_type_id: number;
  name: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  forward_overhang?: number;
  back_overhang?: number;
  cog?: number;
  x_start_position: number;
  y_start_position: number;
  status?: 'inventory' | 'onStage' | 'onDeck';
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

export interface AllowedMacConstraint {
  id?: number;
  gross_aircraft_weight: number;
  min_mac: number;
  max_mac: number;
}
