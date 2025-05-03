import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1002,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 200,
    padding: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default FloatingMenu;
