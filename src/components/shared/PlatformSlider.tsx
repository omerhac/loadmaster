import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface PlatformSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  style?: any;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
}

const PlatformSlider: React.FC<PlatformSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  style,
  minimumTrackTintColor = "#007bff",
  maximumTrackTintColor = "#ddd",
  thumbTintColor = "#007bff",
  disabled = false,
  label,
  showValue = true,
}) => {
  const isWindows = Platform.OS === 'windows';

  const handleIncrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.min(value + step, maximumValue);
    onValueChange(newValue);
  }, [value, step, maximumValue, disabled, onValueChange]);

  const handleDecrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.max(value - step, minimumValue);
    onValueChange(newValue);
  }, [value, step, minimumValue, disabled, onValueChange]);

  const handleTextChange = useCallback((text: string) => {
    if (disabled) return;
    const numValue = parseFloat(text) || 0;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, numValue));
    onValueChange(clampedValue);
  }, [minimumValue, maximumValue, disabled, onValueChange]);

  const formatValue = useCallback((val: number) => {
    return step < 1 ? val.toFixed(1) : val.toString();
  }, [step]);

  if (isWindows) {
    // Windows fallback: TextInput with +/- buttons
    return (
      <View style={[styles.windowsContainer, style]}>
        {label && <Text style={styles.windowsLabel}>{label}</Text>}
        <View style={styles.windowsSliderRow}>
          <TouchableOpacity
            style={[styles.windowsButton, disabled && styles.windowsButtonDisabled]}
            onPress={handleDecrement}
            disabled={disabled || value <= minimumValue}
          >
            <Text style={[styles.windowsButtonText, disabled && styles.windowsButtonTextDisabled]}>-</Text>
          </TouchableOpacity>
          
          <TextInput
            style={[styles.windowsInput, disabled && styles.windowsInputDisabled]}
            value={formatValue(value)}
            onChangeText={handleTextChange}
            keyboardType="numeric"
            editable={!disabled}
            selectTextOnFocus
          />
          
          <TouchableOpacity
            style={[styles.windowsButton, disabled && styles.windowsButtonDisabled]}
            onPress={handleIncrement}
            disabled={disabled || value >= maximumValue}
          >
            <Text style={[styles.windowsButtonText, disabled && styles.windowsButtonTextDisabled]}>+</Text>
          </TouchableOpacity>
          
          {showValue && (
            <Text style={[styles.windowsValueDisplay, disabled && styles.windowsValueDisplayDisabled]}>
              {formatValue(value)}
            </Text>
          )}
        </View>
        
        <View style={styles.windowsRangeInfo}>
          <Text style={styles.windowsRangeText}>
            Range: {formatValue(minimumValue)} - {formatValue(maximumValue)}
            {step !== 1 && ` (step: ${formatValue(step)})`}
          </Text>
        </View>
      </View>
    );
  }

  // iOS/Android: Use native slider
  return (
    <View style={[styles.nativeContainer, style]}>
      {label && <Text style={styles.nativeLabel}>{label}</Text>}
      <View style={styles.nativeSliderRow}>
        <Slider
          style={styles.nativeSlider}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor={minimumTrackTintColor}
          maximumTrackTintColor={maximumTrackTintColor}
          thumbTintColor={thumbTintColor}
          disabled={disabled}
        />
        {showValue && (
          <Text style={[styles.nativeValueDisplay, disabled && styles.nativeValueDisplayDisabled]}>
            {formatValue(value)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Windows-specific styles
  windowsContainer: {
    marginVertical: 5,
  },
  windowsLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  windowsSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  windowsButton: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  windowsButtonDisabled: {
    backgroundColor: '#ccc',
  },
  windowsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  windowsButtonTextDisabled: {
    color: '#999',
  },
  windowsInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 14,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  windowsInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  windowsValueDisplay: {
    fontSize: 12,
    color: '#333',
    minWidth: 50,
    textAlign: 'right',
    marginLeft: 5,
  },
  windowsValueDisplayDisabled: {
    color: '#999',
  },
  windowsRangeInfo: {
    marginTop: 2,
  },
  windowsRangeText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },

  // Native (iOS/Android) styles
  nativeContainer: {
    marginVertical: 5,
  },
  nativeLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  nativeSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nativeSlider: {
    flex: 1,
    height: 30,
  },
  nativeValueDisplay: {
    fontSize: 12,
    color: '#333',
    minWidth: 50,
    textAlign: 'right',
    marginLeft: 5,
  },
  nativeValueDisplayDisabled: {
    color: '#999',
  },
});

export default PlatformSlider; 