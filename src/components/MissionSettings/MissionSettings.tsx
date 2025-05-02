import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MissionSettings } from '../../types';

type MissionSettingsProps = {
  settings?: MissionSettings;
  onReturn: () => void;
  onSave: (settings: MissionSettings) => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MissionSettingsComponent = ({ settings, onReturn }: MissionSettingsProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mission Settings</Text>
        <TouchableOpacity onPress={onReturn} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Planning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Settings functionality will be implemented soon.
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
  },
});

export default MissionSettingsComponent;
