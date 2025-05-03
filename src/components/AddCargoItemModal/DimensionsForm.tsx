import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './AddCargoItemModal.styles';

interface DimensionsFormProps {
  name: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  onNameChange: (value: string) => void;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
}

const DimensionsForm: React.FC<DimensionsFormProps> = React.memo(({
  name,
  length,
  width,
  height,
  weight,
  onNameChange,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onWeightChange
}) => {
  return (
    <View style={styles.compactFormContainer}>
      {/* Name Field */}
      <View style={styles.formRow}>
        <View style={styles.formFullWidth}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={onNameChange}
            placeholder="Item Name"
          />
        </View>
      </View>

      {/* Dimensions Fields */}
      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.label}>Length (in)</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={onLengthChange}
            keyboardType="numeric"
            placeholder="Length"
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Width (in)</Text>
          <TextInput
            style={styles.input}
            value={width}
            onChangeText={onWidthChange}
            keyboardType="numeric"
            placeholder="Width"
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Height (in)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={onHeightChange}
            keyboardType="numeric"
            placeholder="Height"
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={onWeightChange}
            keyboardType="numeric"
            placeholder="Weight"
          />
        </View>
      </View>
    </View>
  );
});

DimensionsForm.displayName = 'DimensionsForm';

export default DimensionsForm; 