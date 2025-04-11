import { FloorLayoutService } from './FloorLayoutService';

export {
  FloorLayoutService,
  Point,
  Compartment,
  WheelSpan,
  WheelType
} from './FloorLayoutService';

// Export a singleton instance for convenience
export const floorLayoutService = new FloorLayoutService(); 