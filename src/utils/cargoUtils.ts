import { CargoItem, Position } from '../types';

/**
 * Convert fuselage station (fs) to x position
 * Formula: x_position = fs - cog
 */
export function fsToXPosition(fs: number, cog: number): number {
  return fs - cog;
}

/**
 * Convert x position to fuselage station (fs)
 * Formula: fs = x_position + cog
 */
export function xPositionToFs(xPosition: number, cog: number): number {
  return Math.round(xPosition + cog);
}

/**
 * Update cargo item with new fs value and sync x position
 */
export function updateCargoItemFs(item: CargoItem, newFs: number): CargoItem {
  const newXPosition = fsToXPosition(newFs, item.cog);
  return {
    ...item,
    fs: newFs,
    position: {
      ...item.position,
      x: newXPosition,
    },
  };
}

/**
 * Update cargo item with new x position and sync fs value
 */
export function updateCargoItemXPosition(item: CargoItem, newXPosition: number): CargoItem {
  const newFs = xPositionToFs(newXPosition, item.cog);
  return {
    ...item,
    fs: newFs,
    position: {
      ...item.position,
      x: newXPosition,
    },
  };
}

/**
 * Update cargo item with new position and sync fs value
 * Only calculates FS for onDeck items, sets to 0 for others
 */
export function updateCargoItemPosition(item: CargoItem, newPosition: Position): CargoItem {
  const newFs = item.status === 'onDeck' && newPosition.x >= 0 ? xPositionToFs(newPosition.x, item.cog) : 0;
  return {
    ...item,
    fs: newFs,
    position: newPosition,
  };
}

/**
 * Update cargo item with new cog and sync both fs and x position
 * When cog changes, we keep fs constant and update x position
 */
export function updateCargoItemCog(item: CargoItem, newCog: number): CargoItem {
  const newXPosition = fsToXPosition(item.fs, newCog);
  return {
    ...item,
    cog: newCog,
    position: {
      ...item.position,
      x: newXPosition,
    },
  };
}

/**
 * Calculate MAC index for a cargo item using the standard formula
 * This matches the calculation in MacCalculationService but works with CargoItem data
 * @param item - The cargo item to calculate MAC index for
 * @returns The MAC index as a number
 */
export function calculateCargoItemMACIndex(item: CargoItem): number {
  if (item.status !== 'onDeck') {
    return 0;
  }
  
  // Calculate center point using cargo item's dimensions
  const centerX = item.position.x + (item.length / 2);
  
  // Use the same formula as MacCalculationService
  const macIndex = (centerX - 533.46) * item.weight / 50000;
  
  return macIndex;
}

