import {
  getCargoCorners,
  getWheelTouchpoints,
  getWheelContactSpan,
  isTouchpointOnTreadway,
  getTouchpointCompartments,
  isOnTreadway,
  getCompartmentOverlap,
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
  isOnTreadway,
  getCompartmentOverlap,
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

// Export Floor Load Calculation Service
export {
  calculateConcentratedLoad,
  calculateLoadPerCompartment,
  calculateRunningLoad,
  aggregateCumulativeLoadByCompartment,
  WheelType,
  TouchpointPosition,
  LoadResult,
  CompartmentLoadResult,
} from './FloorLoadCalculationService';

// Export Floor Load Validation Service
export {
  validateMissionLoadConstraints,
  validateCumulativeLoad,
  validateConcentratedLoad,
  ValidationStatus,
  LoadConstraintType,
  RunningLoadCategory,
  ValidationResult,
  CumulativeLoadValidationResult,
  ConcentratedLoadValidationResult,
  RunningLoadValidationResult,
  LoadValidationResult,
  MissionValidationResults,
} from './FloorLoadValidationService';
