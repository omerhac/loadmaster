/**
 * MAC Calculation Service Exports
 */

export {
  calculateMACPercent,
  calculateMACIndex,
  calculateAircraftCG,
  calculateAdditionalWeightsMACIndex as calculateAdditionalWeightsMAC,
  calculateTotalAircraftWeight,
  calculateFuelMAC,
  getEmptyAircraftMACIndex,
  calculateLoadmastersWeight,
  calculateLoadmastersIndex,
  calculateBaseWeight,
  calculateTotalFuelWeight,
  calculateCargoWeight,
  calculateCargoMACIndex,
  calculateTotalIndex,
  calculateZeroFuelWeight,
} from './MacCalculationService';

/**
 * MAC Validation Service Exports
 */

export {
  validateMac,
  validateMissionMac,
} from './MacValidationService';

export type { MacValidationResult } from './MacValidationService';
