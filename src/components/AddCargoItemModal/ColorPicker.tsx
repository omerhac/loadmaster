import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const CARGO_COLORS = [
  '#4a90e2', // Blue (default)
  '#e74c3c', // Red
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#e67e22', // Dark Orange
  '#34495e', // Dark Blue Gray
  '#f1c40f', // Yellow
  '#e91e63', // Pink
];

const COLOR_NAMES = [
  'Blue',
  'Red',
  'Green',
  'Orange',
  'Purple',
  'Turquoise',
  'Dark Orange',
  'Dark Gray',
  'Yellow',
  'Pink',
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Color</Text>
      <View style={styles.colorGrid}>
        {CARGO_COLORS.map((color, index) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
            ]}
            onPress={() => onColorSelect(color)}
            accessibilityLabel={`Select ${COLOR_NAMES[index]} color`}
          >
            {selectedColor === color && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedColor: {
    borderColor: '#333',
    borderWidth: 3,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ColorPicker;
