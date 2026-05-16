import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Portal} from 'react-native-portalize';

export const LOCATION_OPTIONS = [
  '1 - Ramat David',
  '4 - Hazor',
  '6 - Hazerim',
  '8 - Tel Nof',
  '10 - Ovda',
  '25 - Ramon',
  '28 - Nevatim',
  '30 - Palmahim',
  'Other',
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
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleSelect = useCallback(
    (location: string) => {
      onSelect(location);
      setIsOpen(false);
    },
    [onSelect],
  );

  const displayValue = value || placeholder;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.dropdown, !value && styles.placeholder]}
        onPress={toggleDropdown}
        activeOpacity={0.7}>
        <Text style={[styles.text, !value && styles.placeholderText]}>
          {displayValue}
        </Text>
        <Text style={[styles.arrow, isOpen && styles.arrowOpen]}>▼</Text>
      </TouchableOpacity>
      {isOpen && (
        <Portal>
          <View style={styles.modalRoot}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setIsOpen(false)}
            />
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>{placeholder}</Text>
              <ScrollView
                style={styles.optionsList}
                keyboardShouldPersistTaps="handled">
                {LOCATION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      option === value && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.optionText,
                        option === value && styles.optionTextSelected,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Portal>
      )}
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
  arrowOpen: {
    transform: [{rotate: '180deg'}],
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  optionsContainer: {
    width: 280,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  optionsTitle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsList: {
    maxHeight: 220,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionSelected: {
    backgroundColor: '#e8f0fe',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#1a73e8',
  },
});

export default LocationDropdown;
