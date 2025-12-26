import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { calculateCargoChartY } from '../../services/cargoChart';

// Chart axis ranges (in 1,000 lbs)
const CHART_X_MAX = 65;  // Fuel weight axis
const CHART_Y_MAX = 62.5; // Y axis

// Direct pixel offsets to fine-tune dot position
const DOT_X_OFFSET = 2;   // Pixels to shift right
const DOT_Y_OFFSET = 8;   // Pixels to shift down

export type AREAGraphProps = {
  imageSourceTop: ImageSourcePropType;
  imageSourceBottom: ImageSourcePropType;
  width?: number;
  baseWeight: number;
  fuelWeight: number;
  cargoWeight: number;
};

export const AREAGraph = ({ 
  imageSourceTop, 
  imageSourceBottom, 
  width = 350,
  baseWeight,
  fuelWeight,
  cargoWeight,
}: AREAGraphProps) => {
  const resolvedTop = Image.resolveAssetSource(imageSourceTop);
  const resolvedBottom = Image.resolveAssetSource(imageSourceBottom);
  
  const topAspectRatio = resolvedTop.width / resolvedTop.height;
  const bottomAspectRatio = resolvedBottom.width / resolvedBottom.height;
  
  const topHeight = width / topAspectRatio;
  const bottomHeight = width / bottomAspectRatio;

  // Calculate Y value using the cargo chart service
  const chartResult = calculateCargoChartY(baseWeight, cargoWeight);
  const yValueKlbs = chartResult.yValue;
  
  // Convert fuel weight to klbs for X position
  const xValueKlbs = fuelWeight / 1000;
  
  // Calculate pixel positions on the top graph
  // X: 0 is left edge, CHART_X_MAX is right edge
  const xPercent = xValueKlbs / CHART_X_MAX;
  const dotX = (xPercent * width) + DOT_X_OFFSET;
  
  // Y: 0 is bottom, CHART_Y_MAX is top (need to invert for pixels)
  const yPercent = yValueKlbs / CHART_Y_MAX;
  const dotY = topHeight - (yPercent * topHeight) + DOT_Y_OFFSET;

  return (
    <View style={styles.container}>
      <View style={{ position: 'relative' }}>
        <Image source={imageSourceTop} style={{ width, height: topHeight }} resizeMode="contain" />
        <View
          style={[
            styles.dot,
            {
              left: dotX - 6,
              top: dotY - 6,
            },
          ]}
        />
      </View>
      <Image source={imageSourceBottom} style={{ width, height: bottomHeight, marginLeft: -4 }} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: 'white',
  },
});
