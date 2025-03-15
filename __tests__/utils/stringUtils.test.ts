import { reverseString, capitalizeFirstLetter } from '@utils/stringUtils';

describe('String Utilities', () => {
  describe('reverseString', () => {
    it('should reverse a string correctly', () => {
      expect(reverseString('hello')).toBe('olleh');
    });

    it('should handle empty string', () => {
      expect(reverseString('')).toBe('');
    });

    it('should handle palindromes', () => {
      expect(reverseString('racecar')).toBe('racecar');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
    });
  });
}); 