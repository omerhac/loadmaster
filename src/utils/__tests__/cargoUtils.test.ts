import {
  fsToXPosition,
  xPositionToFs,
  updateCargoItemFs,
  updateCargoItemXPosition,
  updateCargoItemPosition,
  updateCargoItemCog,
} from '../cargoUtils';
import { CargoItem } from '../../types';

describe('cargoUtils', () => {
  const mockCargoItem: CargoItem = {
    id: 'test-1',
    cargo_type_id: 1,
    name: 'Test Item',
    length: 100,
    width: 50,
    height: 30,
    weight: 1000,
    cog: 50,
    status: 'inventory',
    position: { x: 200, y: 100 },
    fs: 250,
  };

  describe('fsToXPosition', () => {
    it('should convert fs to x position correctly', () => {
      expect(fsToXPosition(250, 50)).toBe(200);
      expect(fsToXPosition(300, 25)).toBe(275);
      expect(fsToXPosition(100, 75)).toBe(25);
    });
  });

  describe('xPositionToFs', () => {
    it('should convert x position to fs correctly', () => {
      expect(xPositionToFs(200, 50)).toBe(250);
      expect(xPositionToFs(275, 25)).toBe(300);
      expect(xPositionToFs(25, 75)).toBe(100);
    });

    it('should round the result', () => {
      expect(xPositionToFs(199.7, 50.3)).toBe(250);
      expect(xPositionToFs(199.2, 50.3)).toBe(250);
    });
  });

  describe('updateCargoItemFs', () => {
    it('should update fs and sync x position', () => {
      const result = updateCargoItemFs(mockCargoItem, 300);
      
      expect(result.fs).toBe(300);
      expect(result.position.x).toBe(250); // 300 - 50
      expect(result.position.y).toBe(100); // unchanged
      expect(result.cog).toBe(50); // unchanged
    });
  });

  describe('updateCargoItemXPosition', () => {
    it('should update x position and sync fs', () => {
      const result = updateCargoItemXPosition(mockCargoItem, 150);
      
      expect(result.position.x).toBe(150);
      expect(result.fs).toBe(200); // 150 + 50
      expect(result.position.y).toBe(100); // unchanged
      expect(result.cog).toBe(50); // unchanged
    });
  });

  describe('updateCargoItemPosition', () => {
    it('should update position and sync fs for onDeck items', () => {
      const onDeckItem = { ...mockCargoItem, status: 'onDeck' as const };
      const newPosition = { x: 175, y: 200 };
      const result = updateCargoItemPosition(onDeckItem, newPosition);
      
      expect(result.position).toEqual(newPosition);
      expect(result.fs).toBe(225); // 175 + 50
      expect(result.cog).toBe(50); // unchanged
    });

    it('should set fs to 0 for non-onDeck items', () => {
      const inventoryItem = { ...mockCargoItem, status: 'inventory' as const };
      const newPosition = { x: 175, y: 200 };
      const result = updateCargoItemPosition(inventoryItem, newPosition);
      
      expect(result.position).toEqual(newPosition);
      expect(result.fs).toBe(0); // Should be 0 for inventory items
      expect(result.cog).toBe(50); // unchanged
    });

    it('should set fs to 0 for invalid positions', () => {
      const onDeckItem = { ...mockCargoItem, status: 'onDeck' as const };
      const newPosition = { x: -1, y: 200 };
      const result = updateCargoItemPosition(onDeckItem, newPosition);
      
      expect(result.position).toEqual(newPosition);
      expect(result.fs).toBe(0); // Should be 0 for invalid x position
      expect(result.cog).toBe(50); // unchanged
    });
  });

  describe('updateCargoItemCog', () => {
    it('should update cog and sync x position while keeping fs constant', () => {
      const result = updateCargoItemCog(mockCargoItem, 75);
      
      expect(result.cog).toBe(75);
      expect(result.fs).toBe(250); // unchanged
      expect(result.position.x).toBe(175); // 250 - 75
      expect(result.position.y).toBe(100); // unchanged
    });
  });

  describe('fs and x_position synchronization', () => {
    it('should maintain consistency when converting back and forth', () => {
      const originalFs = 250;
      const cog = 50;
      
      const xPos = fsToXPosition(originalFs, cog);
      const backToFs = xPositionToFs(xPos, cog);
      
      expect(backToFs).toBe(originalFs);
    });

    it('should maintain consistency in cargo item updates', () => {
      const item = mockCargoItem;
      
      // Update fs, then update x position back to original
      const updatedFs = updateCargoItemFs(item, 300);
      const backToOriginal = updateCargoItemXPosition(updatedFs, item.position.x);
      
      expect(backToOriginal.fs).toBe(item.fs);
      expect(backToOriginal.position.x).toBe(item.position.x);
    });
  });
}); 