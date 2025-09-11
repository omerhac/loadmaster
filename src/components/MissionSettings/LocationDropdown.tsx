import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const LOCATION_OPTIONS = [
  '1 - Ramat David',
  '4 - Hazor',
  '6 - Hazerim',
  '8 - Tel Nof',
  '10 - Ovda',
  '25 - Ramon',
  '28 - Nevatim',
  '30 - Palmahim',
  'Other'
];

interface LocationDropdownProps {
  value: string;
  onSelect: (location: string) => void;
  placeholder?: string;
  style?: any;
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  value,
  onSelect,
  placeholder = 'Select location',
  style,
}) => {
  const handlePress = () => {
    const currentIndex = LOCATION_OPTIONS.findIndex(option => option === value);
    const nextIndex = (currentIndex + 1) % LOCATION_OPTIONS.length;
    onSelect(LOCATION_OPTIONS[nextIndex]);
  };

  const displayValue = value || placeholder;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.dropdown, !value && styles.placeholder]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, !value && styles.placeholderText]}>
          {displayValue}
        </Text>
        <Text style={styles.arrow}>
          ▼
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  placeholder: {
    borderColor: '#ccc',
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});

export default LocationDropdown;