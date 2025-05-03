import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './Preview.styles';

type PreviewProps = {
  items: CargoItem[];
  onSave: (items: CargoItem[]) => void;
  onReturn: () => void;
};

const Preview = ({ items, onReturn }: PreviewProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mission Preview</Text>
        <TouchableOpacity onPress={onReturn} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Planning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Preview functionality will be implemented soon.
        </Text>

        <Text style={styles.statsText}>
          {`Total Items: ${items.length}`}
        </Text>
        <Text style={styles.statsText}>
          {`Items on Deck: ${items.filter(i => i.status === 'onDeck').length}`}
        </Text>
        <Text style={styles.statsText}>
          {`Items on Stage: ${items.filter(i => i.status === 'onStage').length}`}
        </Text>
      </View>
    </View>
  );
};

export default Preview;
