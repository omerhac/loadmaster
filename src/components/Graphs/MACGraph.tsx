import { View, ImageBackground, StyleSheet, ImageSourcePropType, Text, Platform } from 'react-native';

export type MACGraphProps = {
  macPercent: number; // e.g. 24.5
  weight: number;     // e.g. 135000
  imageSource: ImageSourcePropType;
  width?: number;
  height?: number;
};

const MAC_MIN = 14;
const MAC_MAX = 32;
const WEIGHT_MIN = 70000;
const WEIGHT_MAX = 180000;

export const MACGraph = ({
  macPercent,
  weight,
  imageSource,
  width = 350,
  height = 350,
}: MACGraphProps) => {
  // Map MAC% and weight to image coordinates
  const x = ((macPercent - MAC_MIN) / (MAC_MAX - MAC_MIN)) * width;
  const y = height - ((weight - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * height;

  return (
    <ImageBackground source={imageSource} style={{ width, height }}>
      <View
        style={[
          styles.cross,
          { left: x - 10, top: y - 10 }, // Center the cross
        ]}
      >
        <View style={styles.crossLineVertical} />
        <View style={styles.crossLineHorizontal} />
        <Text
          style={styles.debug}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {`${isNaN(x) ? '?' : Math.round(x)} , ${isNaN(y) ? '?' : Math.round(y)}`}
        </Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  debug: {
    position: 'absolute',
    top: -20,
    left: -30,
    borderColor: 'blue',
    borderWidth: 1,
    width: 60,
    color: 'blue',
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingHorizontal: 2,
    paddingVertical: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  cross: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  crossLineVertical: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'red',
    left: 9,
    top: 0,
  },
  crossLineHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: 'red',
    left: 0,
    top: 9,
  },
});
