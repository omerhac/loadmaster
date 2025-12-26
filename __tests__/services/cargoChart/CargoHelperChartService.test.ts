import {
  calculateCargoChartY,
  getCargoChartYInPounds,
  isWithinChartRange,
  CHART_CONFIG,
} from '../../../src/services/cargoChart/CargoHelperChartService';

describe('CargoHelperChartService', () => {
  describe('calculateCargoChartY', () => {
    it('should return correct Y value for operating weight at reference point (90k lbs)', () => {
      // At operating weight 90k (left edge), cargo weight should equal Y value
      const result = calculateCargoChartY(90000, 10000);

      expect(result.operatingWeightKlbs).toBe(90);
      expect(result.cargoWeightKlbs).toBe(10);
      expect(result.yValue).toBe(10); // No deviation from reference
    });

    it('should return higher Y value as operating weight decreases', () => {
      // At operating weight 80k, cargo weight 10k
      // Deviation from 90k = 10, so Y = 10 + 10 = 20
      const result = calculateCargoChartY(80000, 10000);

      expect(result.operatingWeightKlbs).toBe(80);
      expect(result.cargoWeightKlbs).toBe(10);
      expect(result.yValue).toBe(20);
    });

    it('should return even higher Y value at lower operating weight', () => {
      // At operating weight 70k, cargo weight 10k
      // Deviation from 90k = 20, so Y = 10 + 20 = 30
      const result = calculateCargoChartY(70000, 10000);

      expect(result.operatingWeightKlbs).toBe(70);
      expect(result.cargoWeightKlbs).toBe(10);
      expect(result.yValue).toBe(30);
    });

    it('should handle zero cargo weight', () => {
      const result = calculateCargoChartY(80000, 0);

      expect(result.cargoWeightKlbs).toBe(0);
      expect(result.yValue).toBe(10); // 0 + (90-80)*1 = 10
    });

    it('should handle high cargo weight', () => {
      const result = calculateCargoChartY(90000, 50000);

      expect(result.cargoWeightKlbs).toBe(50);
      expect(result.yValue).toBe(50);
    });

    it('should mark values within bounds as valid', () => {
      const result = calculateCargoChartY(80000, 20000);

      expect(result.isWithinBounds).toBe(true);
    });

    it('should mark operating weight below minimum as out of bounds', () => {
      const result = calculateCargoChartY(60000, 10000); // 60k is below min 68k

      expect(result.isWithinBounds).toBe(false);
    });

    it('should mark operating weight above maximum as out of bounds', () => {
      const result = calculateCargoChartY(95000, 10000); // 95k is above max 90k

      expect(result.isWithinBounds).toBe(false);
    });

    it('should mark cargo weight above maximum as out of bounds', () => {
      const result = calculateCargoChartY(80000, 65000); // 65k cargo is above max 60k

      expect(result.isWithinBounds).toBe(false);
    });

    it('should mark Y value exceeding chart bounds as out of bounds', () => {
      // Operating weight 68k (lowest), cargo 50k
      // Y = 50 + (90-68) = 50 + 22 = 72, which exceeds maxCargoWeight of 60
      const result = calculateCargoChartY(68000, 50000);

      expect(result.yValue).toBe(72);
      expect(result.isWithinBounds).toBe(false);
    });
  });

  describe('getCargoChartYInPounds', () => {
    it('should return Y value converted to pounds', () => {
      // At 80k operating, 10k cargo -> Y = 20 (in thousands)
      const yPounds = getCargoChartYInPounds(80000, 10000);

      expect(yPounds).toBe(20000);
    });

    it('should handle reference operating weight', () => {
      const yPounds = getCargoChartYInPounds(90000, 25000);

      expect(yPounds).toBe(25000);
    });
  });

  describe('isWithinChartRange', () => {
    it('should return true for valid inputs', () => {
      expect(isWithinChartRange(80000, 20000)).toBe(true);
      expect(isWithinChartRange(85000, 15000)).toBe(true);
      expect(isWithinChartRange(75000, 10000)).toBe(true);
    });

    it('should return false for invalid operating weight', () => {
      expect(isWithinChartRange(60000, 20000)).toBe(false); // Too low
      expect(isWithinChartRange(95000, 20000)).toBe(false); // Too high
    });

    it('should return false for invalid cargo weight', () => {
      expect(isWithinChartRange(80000, -5000)).toBe(false); // Negative
      expect(isWithinChartRange(80000, 70000)).toBe(false); // Too high
    });
  });

  describe('CHART_CONFIG', () => {
    it('should have correct boundary values', () => {
      expect(CHART_CONFIG.minOperatingWeight).toBe(68);
      expect(CHART_CONFIG.maxOperatingWeight).toBe(90);
      expect(CHART_CONFIG.minCargoWeight).toBe(0);
      expect(CHART_CONFIG.maxCargoWeight).toBe(65);
    });

    it('should have line slope defined', () => {
      expect(CHART_CONFIG.lineSlope).toBeDefined();
      expect(typeof CHART_CONFIG.lineSlope).toBe('number');
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for typical C-130 base weight with light cargo', () => {
      // Base weight ~88k lbs, cargo 5k lbs
      const result = calculateCargoChartY(88000, 5000);

      expect(result.yValue).toBeCloseTo(7, 1); // 5 + (90-88)*1 = 7
      expect(result.isWithinBounds).toBe(true);
    });

    it('should calculate for typical C-130 base weight with heavy cargo', () => {
      // Base weight ~88k lbs, cargo 40k lbs
      const result = calculateCargoChartY(88000, 40000);

      expect(result.yValue).toBeCloseTo(42, 1); // 40 + (90-88)*1 = 42
      expect(result.isWithinBounds).toBe(true);
    });

    it('should calculate for lower base weight scenario', () => {
      // Base weight ~78k lbs, cargo 20k lbs
      const result = calculateCargoChartY(78000, 20000);

      expect(result.yValue).toBeCloseTo(32, 1); // 20 + (90-78)*1 = 32
      expect(result.isWithinBounds).toBe(true);
    });
  });
});
