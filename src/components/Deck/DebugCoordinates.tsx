import React from 'react';
import { Text } from 'react-native';
import { Position } from '../../types';
import { styles } from './Deck.styles';

// Toggle this to true to show corner debug coordinates
export const SHOW_DEBUG_COORDS = true;

interface DebugCoordinatesProps {
  pos: Position;
  itemWidth: number;
  itemHeight: number;
  deckSize: { width: number; height: number };
}

const DebugCoordinates: React.FC<DebugCoordinatesProps> = ({ pos, itemWidth, itemHeight, deckSize }) => {
  // Compute pixel-space corners
  const corners = {
    topLeft:     { x: pos.x,                   y: pos.y                    },
    topRight:    { x: pos.x + itemWidth,       y: pos.y                    },
    bottomLeft:  { x: pos.x,                   y: pos.y + itemHeight       },
    bottomRight: { x: pos.x + itemWidth,       y: pos.y + itemHeight       },
  };

  // Normalize into 0–600 space with Y inverted so bottom = 0
  const scaleFactor = 600 / deckSize.width;
  const normalizedCorners: Record<keyof typeof corners, Position> = {
    topLeft:     { x: 0, y: 0 },
    topRight:    { x: 0, y: 0 },
    bottomLeft:  { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 },
  };
  (Object.keys(corners) as Array<keyof typeof corners>).forEach(key => {
    const { x, y } = corners[key];
    normalizedCorners[key] = {
      x: parseFloat((x * scaleFactor).toFixed(2)),
      y: parseFloat(((deckSize.height - y) * scaleFactor).toFixed(2)),
    };
  });

  // Label positioning within the item
  const labelStyles: Record<keyof typeof corners, any> = {
    topLeft:     { top: 0,    left: 0    },
    topRight:    { top: 0,    right: 0   },
    bottomLeft:  { bottom: 0, left: 0    },
    bottomRight: { bottom: 0, right: 0   },
  };

  return (
    <>
      {(Object.entries(normalizedCorners) as [keyof typeof corners, Position][]).map(([key, coord]) => (
        <Text
          key={key}
          style={[styles.coordLabel, labelStyles[key], { fontSize: 5 }]}
        >
          {`(${coord.x}, ${coord.y})`}
        </Text>
      ))}
    </>
  );
};

export default DebugCoordinates; 
