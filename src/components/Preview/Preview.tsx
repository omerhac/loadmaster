import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CargoItem } from '../../types';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  backButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsText: {
    fontSize: 14,
    color: '#444',
    marginVertical: 4,
  },
});

export default Preview;
