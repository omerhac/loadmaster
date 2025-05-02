import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  style?: any;
};

type FloatingMenuProps = {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
};

const FloatingMenu = ({ items, isOpen, onClose, position = { top: 60, right: 10 } }: FloatingMenuProps) => {
  const menuRef = useRef<View>(null);
  const { width: screenWidth } = Dimensions.get('window');

  // Calculate position to ensure menu stays on screen
  const menuRight = Math.min(position.right || 10, screenWidth - 220);

  // Close the menu when clicking outside
  const handleOutsideClick = () => {
    if (isOpen) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <View 
        ref={menuRef}
        style={[
          styles.menuContainer,
          {
            top: position.top,
            right: menuRight,
            left: position.left,
            bottom: position.bottom
          }
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
    width: 220,
    maxWidth: '90%',
    right: 0,
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
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 200,
    padding: 5,
    maxWidth: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#484848',
  },
});

export default FloatingMenu; 