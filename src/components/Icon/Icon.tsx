import React from 'react';
import { View, ViewStyle } from 'react-native';

// Import SVG icons
import AddToStage from '../../../assets/icons/add-to-stage.svg';
import BurgerMenu from '../../../assets/icons/burger-menu.svg';
import CloseBlack from '../../../assets/icons/close-black.svg';
import CloseWhite from '../../../assets/icons/close-white.svg';
import DotMenu from '../../../assets/icons/dot-menu.svg';
import Download from '../../../assets/icons/download.svg';
import Duplicate from '../../../assets/icons/duplicate.svg';
import Edit from '../../../assets/icons/edit.svg';
import Load from '../../../assets/icons/load.svg';
import New from '../../../assets/icons/new.svg';
import Preview from '../../../assets/icons/preview.svg';
import Save from '../../../assets/icons/save.svg';
import Settings from '../../../assets/icons/settings.svg';
import Trash from '../../../assets/icons/trash.svg';
import Undo from '../../../assets/icons/undo.svg';

// Icon type definition
export type IconName =
  | 'add-to-stage'
  | 'burger-menu'
  | 'close-black'
  | 'close-white'
  | 'dot-menu'
  | 'download'
  | 'duplicate'
  | 'edit'
  | 'load'
  | 'new'
  | 'preview'
  | 'save'
  | 'settings'
  | 'trash'
  | 'undo';

// Icon component props
interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Map of icon names to their components
const icons = {
  'add-to-stage': AddToStage,
  'burger-menu': BurgerMenu,
  'close-black': CloseBlack,
  'close-white': CloseWhite,
  'dot-menu': DotMenu,
  'download': Download,
  'duplicate': Duplicate,
  'edit': Edit,
  'load': Load,
  'new': New,
  'preview': Preview,
  'save': Save,
  'settings': Settings,
  'trash': Trash,
  'undo': Undo,
};

// Icon component
const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <IconComponent width={size} height={size} fill={color} />
    </View>
  );
};

export default Icon; 