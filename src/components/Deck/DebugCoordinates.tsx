import React from 'react';
import { Text } from 'react-native';
import { Position } from '../../types';
import { styles } from './Deck.styles';

// Toggle this to true to show corner debug coordinates
export const SHOW_DEBUG_COORDS = true;

interface DebugCoordinatesProps {
  corners: {
    topLeft: Position;
    topRight: Position;
    bottomLeft: Position;
    bottomRight: Position;
  };
}

const DebugCoordinates: React.FC<DebugCoordinatesProps> = ({ corners }) => {
  const labelStyles = {
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0 },
    bottomLeft: { bottom: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
  };

  const formatCoordinate = (coord: Position) => {
    // Round to 1 decimal place
    const x = Math.round(coord.x * 10) / 10;
    const y = Math.round(coord.y * 10) / 10;
    return `(${x}, ${y})`;
  };

  return (
    <>
      {Object.entries(corners).map(([key, coord]) => (
        <Text
          key={key}

          style={[styles.coordLabel, labelStyles[key], { fontSize: 8 }]}
        >
          {formatCoordinate(coord)}
        </Text>
      ))}
    </>
  );
};

export default DebugCoordinates;
