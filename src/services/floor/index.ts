import {
  getCargoCorners,
  getWheelTouchpoints,
  getWheelContactSpan,
  isTouchpointOnTreadway,
  getTouchpointCompartments,
} from './FloorLayoutService';

import type {
  Point,
  WheelSpan,
  TouchpointPosition,
  CornerPosition,
  CargoCorners,
  WheelTouchpoints,
  TouchpointCompartmentResult,
} from './FloorLayoutService';

// Export functions
export {
  getCargoCorners,
  getWheelTouchpoints,
  getWheelContactSpan,
  isTouchpointOnTreadway,
  getTouchpointCompartments,
};

// Export types
export type {
  Point,
  WheelSpan,
  TouchpointPosition,
  CornerPosition,
  CargoCorners,
  WheelTouchpoints,
  TouchpointCompartmentResult,
};

export * from './FloorLoadCalculationService';
