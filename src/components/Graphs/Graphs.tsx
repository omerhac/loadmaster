import { View, Text, StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { MACGraph, AREAGraph } from './index';

export type GraphsProps = {
  macPercent: number;
  weight: number;
  macGraphImgSrc: any; // Use ImageSourcePropType if you want
  areaGraphImgSrc: any; // New prop for the second graph image
  onBack: () => void;
};

export const Graphs = ({ macPercent, weight, macGraphImgSrc, areaGraphImgSrc, onBack }: GraphsProps) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const resolved1 = RNImage.resolveAssetSource(macGraphImgSrc);
  const resolved2 = RNImage.resolveAssetSource(areaGraphImgSrc);
  const aspectRatio1 = resolved1.width / resolved1.height;
  const aspectRatio2 = resolved2.width / resolved2.height;
  // Divide available width between two graphs, with some margin
  const displayWidth = (screenWidth - 48) / 2; // 24px margin on each side
  const maxHeight = screenHeight * 0.8;
  const displayHeight1 = Math.min(displayWidth / aspectRatio1, maxHeight);
  const displayHeight2 = Math.min(displayWidth / aspectRatio2, maxHeight);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={onBack}>{'< Back'}</Text>
      </View>
      <View style={styles.graphsRow}>
        <View style={styles.graphWrapper}>
          <MACGraph
            macPercent={macPercent}
            weight={weight}
            imageSource={macGraphImgSrc}
            width={displayWidth}
            height={displayHeight1}
          />
        </View>
        <View style={styles.graphWrapper}>
          <AREAGraph
            imageSource={areaGraphImgSrc}
            width={displayWidth}
            height={displayHeight2}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#fff', paddingVertical: 8 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  backButton: { fontSize: 16, color: '#007AFF', marginRight: 16, paddingVertical: 4, paddingHorizontal: 8 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  graphsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', width: '100%', gap: 8 },
  graphWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
});
