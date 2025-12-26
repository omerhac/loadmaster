import { View, ImageBackground, StyleSheet, ImageSourcePropType, Text } from 'react-native';
import { calculateCargoChartY } from '../../services/cargoChart';

// Fallback image require
const areaImage = require('../../../assets/images/area_top.png');

// Chart axis ranges (in 1,000 lbs)
const CHART_X_MAX = 65;  // Fuel weight axis
const CHART_Y_MAX = 62.5; // Y axis

// Direct pixel offsets to fine-tune dot position
const DOT_X_OFFSET = 2;   // Pixels to shift right
const DOT_Y_OFFSET = 8;   // Pixels to shift down

const formatWeight = (w: number) => (w / 1000).toFixed(1) + 'k';

export type AREAGraphProps = {
  imageSource: ImageSourcePropType;
  width?: number;
  height?: number;
  baseWeight: number;
  fuelWeight: number;
  cargoWeight: number;
};

export const AREAGraph = ({
  imageSource,
  width = 350,
  height = 350,
  baseWeight,
  fuelWeight,
  cargoWeight,
}: AREAGraphProps) => {
  // Calculate Y value using the cargo chart service
  const chartResult = calculateCargoChartY(baseWeight, cargoWeight);
  const yValueKlbs = chartResult.yValue;

  // Convert fuel weight to klbs for X position
  const xValueKlbs = fuelWeight / 1000;

  // Calculate pixel positions on the graph
  // X: 0 is left edge, CHART_X_MAX is right edge
  const xPercent = xValueKlbs / CHART_X_MAX;
  const dotX = (xPercent * width) + DOT_X_OFFSET;

  // Y: 0 is bottom, CHART_Y_MAX is top (need to invert for pixels)
  const yPercent = yValueKlbs / CHART_Y_MAX;
  const dotY = height - (yPercent * height) + DOT_Y_OFFSET;

  return (
    <View style={{ width, height, backgroundColor: '#eee' }}>
      <ImageBackground source={imageSource || areaImage} style={{ width, height }}>
        <View
          style={[
            styles.dot,
            { left: dotX - 6, top: dotY - 6 },
          ]}
        />
        <View style={[styles.label, { left: dotX + 8, top: dotY - 20 }]}>
          <Text style={styles.labelText}>Fuel: {formatWeight(fuelWeight)}</Text>
          <Text style={styles.labelText}>Cargo: {formatWeight(cargoWeight)}</Text>
        </View>
      </ImageBackground>
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
});
