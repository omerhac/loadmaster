import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, Animated } from 'react-native';

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

// Custom Windows Slider Component
const WindowsSlider: React.FC<{
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  thumbTintColor: string;
  disabled: boolean;
}> = ({
  value,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  disabled,
}) => {
  const sliderWidth = 200; // Fixed width for calculation
  const thumbSize = 20;

  const pan = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Calculate thumb position based on value
  const getThumbPosition = useCallback(() => {
    const range = maximumValue - minimumValue;
    const relativeValue = value - minimumValue;
    const percentage = range > 0 ? relativeValue / range : 0;
    return percentage * (sliderWidth - thumbSize);
  }, [value, minimumValue, maximumValue, sliderWidth, thumbSize]);

  // Convert position to value
  const positionToValue = useCallback((position: number) => {
    const percentage = Math.max(0, Math.min(1, position / (sliderWidth - thumbSize)));
    const range = maximumValue - minimumValue;
    const rawValue = minimumValue + (percentage * range);

    // Snap to step
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  }, [minimumValue, maximumValue, step, sliderWidth, thumbSize]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,

    onPanResponderGrant: () => {
      setIsDragging(true);
      pan.setOffset(getThumbPosition());
      pan.setValue(0);
    },

    onPanResponderMove: (_, gestureState) => {
      if (disabled) {return;}

      const newPosition = getThumbPosition() + gestureState.dx;
      const newValue = positionToValue(newPosition);
      onValueChange(newValue);
    },

    onPanResponderRelease: () => {
      setIsDragging(false);
      pan.flattenOffset();
    },
  });

  const handleTrackPress = useCallback((event: any) => {
    if (disabled) {return;}

    const { locationX } = event.nativeEvent;
    const newValue = positionToValue(locationX - thumbSize / 2);
    onValueChange(newValue);
  }, [disabled, positionToValue, onValueChange, thumbSize]);

  const currentThumbPosition = getThumbPosition();
  const fillWidth = currentThumbPosition + thumbSize / 2;

  return (
    <View style={styles.windowsSliderContainer}>
      {/* Slider Track */}
      <TouchableOpacity
        style={[styles.windowsTrack, { width: sliderWidth }]}
        onPress={handleTrackPress}
        activeOpacity={0.8}
      >
        {/* Track Background */}
        <View style={[styles.windowsTrackBackground, { backgroundColor: maximumTrackTintColor }]} />

        {/* Track Fill */}
        <View
          style={[
            styles.windowsTrackFill,
            {
              width: fillWidth,
              backgroundColor: minimumTrackTintColor,
            },
          ]}
        />

        {/* Draggable Thumb */}
        <Animated.View
          style={[
            styles.windowsThumb,
            {
              left: currentThumbPosition,
              backgroundColor: thumbTintColor,
              borderColor: isDragging ? minimumTrackTintColor : thumbTintColor,
              shadowOpacity: isDragging ? 0.3 : 0.1,
              transform: [{ scale: isDragging ? 1.2 : 1 }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.windowsThumbInner} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const PlatformSlider: React.FC<PlatformSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  style,
  minimumTrackTintColor = '#007bff',
  maximumTrackTintColor = '#ddd',
  thumbTintColor = '#007bff',
  disabled = false,
  label,
  showValue = true,
}) => {
  const handleIncrement = useCallback(() => {
    if (disabled) {return;}
    const newValue = Math.min(value + step, maximumValue);
    onValueChange(newValue);
  }, [value, step, maximumValue, disabled, onValueChange]);

  const handleDecrement = useCallback(() => {
    if (disabled) {return;}
    const newValue = Math.max(value - step, minimumValue);
    onValueChange(newValue);
  }, [value, step, minimumValue, disabled, onValueChange]);



  const formatValue = useCallback((val: number) => {
    return step < 1 ? val.toFixed(1) : val.toString();
  }, [step]);

  // Use custom slider for ALL platforms (previously Windows-only)
  return (
    <View style={[styles.windowsContainer, style]}>
      {/* Top Row: Label and Value */}
      {label && (
        <View style={styles.windowsLabelRow}>
          <Text style={styles.windowsLabel}>{label}</Text>
          {showValue && (
            <Text style={[styles.windowsValueDisplay, disabled && styles.windowsValueDisplayDisabled]}>
              {formatValue(value)}
            </Text>
          )}
        </View>
      )}

      {/* Middle Row: Slider */}
      <View style={styles.windowsSliderRow}>
        <WindowsSlider
          value={value}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          onValueChange={onValueChange}
          minimumTrackTintColor={minimumTrackTintColor}
          maximumTrackTintColor={maximumTrackTintColor}
          thumbTintColor={thumbTintColor}
          disabled={disabled}
        />
      </View>

      {/* Bottom Row: Buttons and Value */}
      <View style={styles.windowsButtonRow}>
        <TouchableOpacity
          style={[styles.windowsButton, disabled && styles.windowsButtonDisabled]}
          onPress={handleDecrement}
          disabled={disabled || value <= minimumValue}
        >
          <Text style={[styles.windowsButtonText, disabled && styles.windowsButtonTextDisabled]}>-</Text>
        </TouchableOpacity>

        {showValue && (
          <Text style={[styles.windowsValueDisplayCenter, disabled && styles.windowsValueDisplayDisabled]}>
            {formatValue(value)}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.windowsButton, disabled && styles.windowsButtonDisabled]}
          onPress={handleIncrement}
          disabled={disabled || value >= maximumValue}
        >
          <Text style={[styles.windowsButtonText, disabled && styles.windowsButtonTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Windows-specific styles
  windowsContainer: {

    paddingHorizontal: 16,

  },
  windowsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  windowsSliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  windowsTrack: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  windowsTrackBackground: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 10,
    right: 10,
  },
  windowsTrackFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 10,
  },
  windowsThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 2,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  windowsThumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },

  windowsButton: {
    backgroundColor: '#0066cc',
    borderRadius: 6,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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

  windowsValueDisplay: {
    fontSize: 14,
    color: '#0066cc',
    minWidth: 60,
    textAlign: 'center',
    fontWeight: '700',
    // backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  windowsValueDisplayDisabled: {
    color: '#999',
  },
  windowsValueDisplayCenter: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '700',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
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
  windowsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  windowsSliderRow: {
    marginBottom: 8,
  },
  windowsButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
});

export default PlatformSlider;
