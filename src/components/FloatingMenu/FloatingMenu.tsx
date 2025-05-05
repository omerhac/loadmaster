import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { styles } from './FloatingMenu.styles';

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  style?: any;
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
            style={[styles.menuItem, item.style]}
            onPress={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.icon}
            <Text style={styles.menuItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default FloatingMenu;
