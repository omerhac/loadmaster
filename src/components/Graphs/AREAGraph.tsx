import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

export type AREAGraphProps = {
  imageSourceTop: ImageSourcePropType;
  imageSourceBottom: ImageSourcePropType;
  width?: number;
};

export const AREAGraph = ({ imageSourceTop, imageSourceBottom, width = 350 }: AREAGraphProps) => {
  const resolvedTop = Image.resolveAssetSource(imageSourceTop);
  const resolvedBottom = Image.resolveAssetSource(imageSourceBottom);
  
  const topAspectRatio = resolvedTop.width / resolvedTop.height;
  const bottomAspectRatio = resolvedBottom.width / resolvedBottom.height;
  
  const topHeight = width / topAspectRatio;
  const bottomHeight = width / bottomAspectRatio;

  return (
    <View style={styles.container}>
      <Image source={imageSourceTop} style={{ width, height: topHeight }} resizeMode="contain" />
      <Image source={imageSourceBottom} style={{ width, height: bottomHeight, marginLeft: -4 }} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
});
