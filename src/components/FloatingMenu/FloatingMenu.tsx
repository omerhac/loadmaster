import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { styles } from './FloatingMenu.styles';

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  style?: any;
  disabled?: boolean;
};

interface FloatingMenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
}

const DEFAULT_POSITION = { top: 45, right: 0 };

const FloatingMenu = ({
  items,
  isOpen,
  onClose,
  position = DEFAULT_POSITION,
}: FloatingMenuProps) => {
  if (!isOpen) {return null;}

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.menuContainer,
          {
            top: position.top,
            right: position.right,
            left: position.left,
            bottom: position.bottom,
          },
        ]}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem, 
              item.style,
              item.disabled && styles.menuItemDisabled
            ]}
            onPress={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            <View style={item.disabled && styles.disabledIcon}>
              {item.icon}
            </View>
            <Text style={[
              styles.menuItemText,
              item.disabled && styles.menuItemTextDisabled
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default FloatingMenu;
