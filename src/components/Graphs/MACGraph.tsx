import { View, ImageBackground, StyleSheet, ImageSourcePropType, Text } from 'react-native';

export type MACGraphProps = {
  macPercent: number; // e.g. 24.5
  weight: number;     // e.g. 135000
  imageSource: ImageSourcePropType;
  width?: number;
  height?: number;
};

const MAC_MIN = 14;
const MAC_MAX = 31;
const WEIGHT_MIN = 70000;
const WEIGHT_MAX = 180000;

// Direct pixel offset to fine-tune dot position
const DOT_X_OFFSET = -4;  // Pixels to shift (negative = left)

const formatWeight = (w: number) => (w / 1000).toFixed(1) + 'k';

export const MACGraph = ({
  macPercent,
  weight,
  imageSource,
  width = 350,
  height = 350,
}: MACGraphProps) => {
  // Map MAC% and weight to image coordinates
  const x = ((macPercent - MAC_MIN) / (MAC_MAX - MAC_MIN)) * width + DOT_X_OFFSET;
  const y = height - ((weight - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * height;

  return (
    <ImageBackground source={imageSource} style={{ width, height }}>
      <View
        style={[
          styles.dot,
          { left: x - 6, top: y - 6 },
        ]}
      />
      <View style={[styles.label, { left: x + 8, top: y - 20 }]}>
        <Text style={styles.labelText}>{macPercent.toFixed(1)}%</Text>
        <Text style={styles.labelText}>{formatWeight(weight)}</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: 'white',
  },
  label: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
