/**
 * Cargo Helper Chart Interpolation Service
 * 
 * This service calculates the Y value from the cargo weight chart
 * given the operating weight (base weight) and cargo weight.
 * 
 * The chart has:
 * - X axis: Operating Weight (1,000 pounds) - range ~68-90
 * - Y axis: Cargo Weight (1,000 pounds) - range 0-60
 * - Inclined lines represent different cargo weight values
 * 
 * The inclined lines run from bottom-left to top-right with a consistent slope.
 */

// Chart boundaries (in 1,000 lbs)
export const CHART_CONFIG = {
  // X axis (Operating Weight in 1,000 lbs)
  minOperatingWeight: 68,
  maxOperatingWeight: 90,
  
  // Y axis (Cargo Weight in 1,000 lbs)  
  minCargoWeight: 0,
  maxCargoWeight: 65,
  
  lineSlope: 1.0,
};

export interface CargoChartResult {
  yValue: number;
  isWithinBounds: boolean;
  operatingWeightKlbs: number;
  cargoWeightKlbs: number;
}

/**
 * Calculates the Y value from the cargo chart
 * 
 * @param operatingWeightLbs - Operating/Base weight in pounds
 * @param cargoWeightLbs - Cargo weight in pounds
 * @returns CargoChartResult with the interpolated Y value
 */
export function calculateCargoChartY(
  operatingWeightLbs: number,
  cargoWeightLbs: number
): CargoChartResult {
  // Convert to thousands of pounds (chart units)
  const operatingWeightKlbs = operatingWeightLbs / 1000;
  const cargoWeightKlbs = cargoWeightLbs / 1000;
  
  const referenceOperatingWeight = 90; // Left edge of chart (in 1,000 lbs)
  const operatingWeightDeviation = referenceOperatingWeight - operatingWeightKlbs;
  
  // The inclined lines slope means for each unit decrease in operating weight,
  // the Y reading increases by the slope factor
  const yValue = cargoWeightKlbs + (operatingWeightDeviation * CHART_CONFIG.lineSlope);
  
  const isWithinBounds = 
    operatingWeightKlbs >= CHART_CONFIG.minOperatingWeight &&
    operatingWeightKlbs <= CHART_CONFIG.maxOperatingWeight &&
    cargoWeightKlbs >= CHART_CONFIG.minCargoWeight &&
    cargoWeightKlbs <= CHART_CONFIG.maxCargoWeight &&
    yValue >= CHART_CONFIG.minCargoWeight &&
    yValue <= CHART_CONFIG.maxCargoWeight;
  
  return {
    yValue,
    isWithinBounds,
    operatingWeightKlbs,
    cargoWeightKlbs,
  };
}

/**
 * Calculates the Y value and returns it in pounds
 * 
 * @param operatingWeightLbs - Operating/Base weight in pounds
 * @param cargoWeightLbs - Cargo weight in pounds
 * @returns Y value in pounds
 */
export function getCargoChartYInPounds(
  operatingWeightLbs: number,
  cargoWeightLbs: number
): number {
  const result = calculateCargoChartY(operatingWeightLbs, cargoWeightLbs);
  return result.yValue * 1000; // Convert back to pounds
}

/**
 * Validates if the given weights are within the chart's valid range
 * 
 * @param operatingWeightLbs - Operating/Base weight in pounds
 * @param cargoWeightLbs - Cargo weight in pounds
 * @returns true if within valid chart range
 */
export function isWithinChartRange(
  operatingWeightLbs: number,
  cargoWeightLbs: number
): boolean {
  const result = calculateCargoChartY(operatingWeightLbs, cargoWeightLbs);
  return result.isWithinBounds;
}
