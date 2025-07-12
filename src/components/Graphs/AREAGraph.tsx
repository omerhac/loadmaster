import { ImageBackground, StyleSheet, ImageSourcePropType } from 'react-native';

export type AREAGraphProps = {
  imageSource: ImageSourcePropType;
  width?: number;
  height?: number;
};

export const AREAGraph = ({ imageSource, width = 350, height = 350 }: AREAGraphProps) => {
  return (
    <ImageBackground source={imageSource} style={{ width, height }} imageStyle={styles.image} />
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'contain',
  },
}); 