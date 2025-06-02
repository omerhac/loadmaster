import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { styles } from './NewMissionModal.styles';

interface NewMissionModalProps {
  visible: boolean;
  onSave: (missionName: string) => void;
  onCancel: () => void;
}

const NewMissionModal: React.FC<NewMissionModalProps> = ({
  visible,
  onSave,
  onCancel,
}) => {
  const [missionName, setMissionName] = useState('');

  const handleSubmit = useCallback(() => {
    if (missionName.trim() === '') {
      return;
    }
    onSave(missionName.trim());
    setMissionName('');
  }, [missionName, onSave]);

  const handleCancel = useCallback(() => {
    setMissionName('');
    onCancel();
  }, [onCancel]);

  const isDataValid = missionName.trim() !== '';

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Create New Mission</Text>

          <View style={styles.formContainer}>
            <View style={styles.formRow}>
              <Text style={styles.label}>Mission Name</Text>
              <TextInput
                style={styles.input}
                value={missionName}
                onChangeText={setMissionName}
                placeholder="Enter mission name"
                autoFocus={true}
                selectTextOnFocus={true}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, !isDataValid && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isDataValid}
            >
              <Text style={styles.saveButtonText}>Create Mission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default NewMissionModal;
