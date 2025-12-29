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
const DOT_X_OFFSET = -2;  // Pixels to shift (negative = left)

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

  // X-axis tick values (MAC %)
  const xTicks = [14, 16, 18, 20, 22, 24, 26, 28, 31];
  // Y-axis tick values (Gross Weight in thousands)
  const yTicks = [70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];

  return (
    <View style={{ position: 'relative' }}>
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
      {/* X-axis tick labels (MAC %) */}
      {xTicks.map((tick) => {
        const tickX = ((tick - MAC_MIN) / (MAC_MAX - MAC_MIN)) * width + DOT_X_OFFSET;
        return (
          <Text key={`x-${tick}`} style={[styles.tickLabel, { left: tickX - 8, bottom: -16 }]}>
            {tick}
          </Text>
        );
      })}
      {/* Y-axis tick labels (Gross Weight) */}
      {yTicks.map((tick) => {
        const tickY = height - ((tick * 1000 - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * height;
        return (
          <Text key={`y-${tick}`} style={[styles.tickLabel, { left: -28, top: tickY - 6 }]}>
            {tick}
          </Text>
        );
      })}
      {/* X-axis legend */}
      <Text style={[styles.axisLegend, { bottom: -32, left: width / 2 - 30 }]}>
        MAC %
      </Text>
      {/* Y-axis legend */}
      <View style={[styles.yAxisLegend, { left: -100, top: height / 2 - 40 }]}>
        <Text style={[styles.axisLegend, { transform: [{ rotate: '-90deg' }], width: 100 }]}>
          Gross Weight (1000 lbs)
        </Text>
      </View>
    </View>
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
  tickLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  axisLegend: {
    position: 'absolute',
    fontSize: 11,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  yAxisLegend: {
    position: 'absolute',
  },
});
