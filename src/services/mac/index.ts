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
} from './MacCalculationService';

/**
 * MAC Validation Service Exports
 */

export {
  validateMac,
  validateMissionMac,
} from './MacValidationService';

export type { MacValidationResult } from './MacValidationService';
