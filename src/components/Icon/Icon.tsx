import React from 'react';
import { View, ViewStyle } from 'react-native';

// Import just one SVG icon for testing
import Settings from '../../../assets/icons/settings.svg';

// Icon component props
interface IconProps {
  name?: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Simple Icon component that only uses Settings icon
const Icon: React.FC<IconProps> = ({ size = 24, color = '#000', style }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Settings width={size} height={size} fill={color} />
    </View>
  );
};

export default Icon;
