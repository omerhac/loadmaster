import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Alert,
} from 'react-native';
import { Mission } from '../../services/db/operations/types';
import { getAllMissions } from '../../services/db/operations/MissionOperations';
import { styles } from './LoadMissionModal.styles';

interface LoadMissionModalProps {
  visible: boolean;
  onLoad: (mission: Mission) => void;
  onCancel: () => void;
}

// Single state object following MissionSettings pattern
type LoadModalState = {
  missions: Mission[];
  selectedMissionId: number | null;
  isLoading: boolean;
  hasError: boolean;
};

const DEFAULT_STATE: LoadModalState = {
  missions: [],
  selectedMissionId: null,
  isLoading: false,
  hasError: false,
};

const LoadMissionModal: React.FC<LoadMissionModalProps> = ({
  visible,
  onLoad,
  onCancel,
}) => {
  // Single state object like MissionSettings
  const [state, setState] = useState<LoadModalState>(DEFAULT_STATE);

  // Check if Windows platform for special handling
  const isWindows = Platform.OS === 'windows';

  // Single update handler like MissionSettings
  const updateState = useCallback((updates: Partial<LoadModalState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadMissions = useCallback(async () => {
    updateState({ isLoading: true, hasError: false });

    try {
      // Windows-specific timeout to prevent hangs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), isWindows ? 5000 : 15000);
      });

      // Race the database call against the timeout
      const databasePromise = getAllMissions();
      const response = await Promise.race([databasePromise, timeoutPromise]);

      // Type assertion needed due to Promise.race
      const dbResponse = response as any;

      // Check if the response has the expected DatabaseResponse structure
      if (dbResponse && dbResponse.results) {
        // Extract missions from the results array
        const missionsData = dbResponse.results.map((result: any) => result.data || result).filter(Boolean);
        
        // Valid array response
        const validMissions = missionsData.filter((mission: any): mission is Mission => {
          return mission &&
                 typeof mission === 'object' &&
                 typeof mission.name === 'string' &&
                 mission.name.trim().length > 0;
        });

        // Sort by modified_date (newest first) with safe date handling
        const sortedMissions = validMissions.sort((a, b) => {
          try {
            const dateA = a.modified_date ? new Date(a.modified_date).getTime() : 0;
            const dateB = b.modified_date ? new Date(b.modified_date).getTime() : 0;
            return dateB - dateA; // Newest first
          } catch {
            return 0; // Keep original order if date parsing fails
          }
        });

        updateState({
          missions: sortedMissions,
          isLoading: false,
          hasError: false,
        });
      } else if (Array.isArray(dbResponse)) {
        // Fallback for direct array response (backward compatibility)
        const validMissions = dbResponse.filter((mission): mission is Mission => {
          return mission &&
                 typeof mission === 'object' &&
                 typeof mission.name === 'string' &&
                 mission.name.trim().length > 0;
        });

        // Sort by modified_date (newest first) with safe date handling
        const sortedMissions = validMissions.sort((a, b) => {
          try {
            const dateA = a.modified_date ? new Date(a.modified_date).getTime() : 0;
            const dateB = b.modified_date ? new Date(b.modified_date).getTime() : 0;
            return dateB - dateA; // Newest first
          } catch {
            return 0; // Keep original order if date parsing fails
          }
        });

        updateState({
          missions: sortedMissions,
          isLoading: false,
          hasError: false,
        });
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.warn('LoadMissionModal: Failed to load missions:', error);
      updateState({
        missions: [],
        isLoading: false,
        hasError: true,
      });

      // Show Windows-specific error handling
      if (isWindows) {
        Alert.alert(
          'Database Error',
          'Failed to load missions on Windows. Please restart the app if this continues.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [isWindows, updateState]);

  // Load missions when modal becomes visible
  useEffect(() => {
    if (visible && state.missions.length === 0 && !state.isLoading) {
      loadMissions();
    }
  }, [visible, state.missions.length, state.isLoading, loadMissions]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setState(DEFAULT_STATE);
    }
  }, [visible]);

  const handleSelectMission = useCallback((missionId: number) => {
    updateState({ selectedMissionId: missionId });
  }, [updateState]);

  const handleLoad = useCallback(() => {
    if (!state.selectedMissionId) {return;}

    const selectedMission = state.missions.find(m => m.id === state.selectedMissionId);
    if (selectedMission) {
      onLoad(selectedMission);
    }
  }, [state.selectedMissionId, state.missions, onLoad]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    loadMissions();
  }, [loadMissions]);

  const handleOverlayPress = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  // Simplified mission item renderer
  const renderMissionItem = useCallback(({ item }: { item: Mission }) => {
    const isSelected = state.selectedMissionId === item.id;
    const displayDate = item.modified_date || 'No date';
    const displayName = item.name || 'Unnamed Mission';

    return (
      <TouchableOpacity
        style={[styles.missionItem, isSelected && styles.missionItemSelected]}
        onPress={() => handleSelectMission(item.id || 0)}
      >
        <Text style={[styles.missionName, isSelected && styles.missionNameSelected]}>
          {displayName}
        </Text>
        <Text style={[styles.missionDate, isSelected && styles.missionDateSelected]}>
          {displayDate}
        </Text>
      </TouchableOpacity>
    );
  }, [state.selectedMissionId, handleSelectMission]);

  // Validation
  const isLoadButtonEnabled = state.selectedMissionId !== null && !state.isLoading;

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={isWindows ? 'padding' : (Platform.OS === 'ios' ? 'padding' : 'height')}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Load Mission</Text>

          <View style={styles.contentContainer}>
            {state.isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {isWindows ? 'Loading missions (this may take a moment on Windows)...' : 'Loading missions...'}
                </Text>
              </View>
            ) : state.hasError ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Failed to load missions</Text>
                <Text style={styles.emptySubtext}>
                  {isWindows
                    ? 'Database error on Windows. Please restart the app.'
                    : 'Please check your connection and try again.'
                  }
                </Text>
                <TouchableOpacity
                  style={[styles.loadButton, { marginTop: 10, alignSelf: 'center' }]}
                  onPress={handleRetry}
                >
                  <Text style={styles.loadButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : state.missions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No missions found</Text>
                <Text style={styles.emptySubtext}>Create a new mission to get started</Text>
              </View>
            ) : (
              <FlatList
                data={state.missions}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={renderMissionItem}
                style={styles.missionList}
                showsVerticalScrollIndicator={true}
                bounces={false}
              />
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loadButton, !isLoadButtonEnabled && styles.loadButtonDisabled]}
              onPress={handleLoad}
              disabled={!isLoadButtonEnabled}
            >
              <Text style={styles.loadButtonText}>Load Mission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoadMissionModal;
