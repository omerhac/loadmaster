import { View, Text, StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { MACGraph } from '../MACGraph/MACGraph';

export type GraphsProps = {
  macPercent: number;
  weight: number;
  imageSource: any; // Use ImageSourcePropType if you want
  onBack: () => void;
};

export const Graphs = ({ macPercent, weight, imageSource, onBack }: GraphsProps) => {
  const { height: screenHeight } = Dimensions.get('window');
  const resolved = RNImage.resolveAssetSource(imageSource);
  const aspectRatio = resolved.width / resolved.height;
  const displayHeight = screenHeight * 0.7;
  const displayWidth = displayHeight * aspectRatio;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={onBack}>{'< Back'}</Text>
        <Text style={styles.title}>MAC% Graph</Text>
      </View>
      <View style={styles.graphWrapper}>
        <MACGraph
          macPercent={macPercent}
          weight={weight}
          imageSource={imageSource}
          width={displayWidth}
          height={displayHeight}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#fff', paddingVertical: 8 },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  backButton: { fontSize: 16, color: '#007AFF', marginRight: 16, paddingVertical: 4, paddingHorizontal: 8 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  graphWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 0 },
});
