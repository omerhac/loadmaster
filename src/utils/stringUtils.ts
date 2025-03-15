/**
 * String utility functions
 */

/**
 * Reverses a string
 * @param str - The string to reverse
 * @returns The reversed string
 */
export const reverseString = (str: string): string => {
  return str.split('').reverse().join('');
};

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}; 