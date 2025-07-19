import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

const LoadMissionModal: React.FC<LoadMissionModalProps> = ({
  visible,
  onLoad,
  onCancel,
}) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if Windows platform for special handling
  const isWindows = Platform.OS === 'windows';

  const loadMissions = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    
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

      if (dbResponse.error) {
        throw new Error(dbResponse.error.message || 'Database error');
      }

      const missionsData: Mission[] = dbResponse.results.map((item: any) => item.data as Mission);
      
      // Filter out any invalid missions (Windows sometimes returns corrupted data)
      const validMissions = missionsData.filter(mission => 
        mission && 
        mission.id && 
        mission.name && 
        typeof mission.id === 'number' &&
        typeof mission.name === 'string'
      );

      // Sort by modified date (most recent first)
      const sortedMissions = validMissions.sort((a, b) => {
        try {
          return new Date(b.modified_date).getTime() - new Date(a.modified_date).getTime();
        } catch {
          // Fallback to creation date if modified date is invalid
          try {
            return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
          } catch {
            // Last resort: sort by ID
            return (b.id || 0) - (a.id || 0);
          }
        }
      });

      setMissions(sortedMissions);
      console.log('Loaded missions:', sortedMissions.length);
    } catch (error) {
      console.error('Error loading missions:', error);
      setHasError(true);
      
      // Windows-specific error handling
      if (isWindows) {
        Alert.alert(
          'Database Error', 
          'Unable to load missions on Windows. The database may be corrupted or inaccessible. Please restart the app and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to load missions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isWindows]);

  // Load missions when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Add a small delay on Windows to ensure UI is ready
      const delay = isWindows ? 300 : 0;
      const timer = setTimeout(() => {
        loadMissions();
        setSelectedMissionId(null); // Reset selection when modal opens
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [visible, loadMissions, isWindows]);

  const selectedMission = useMemo(() =>
    missions.find(mission => mission.id === selectedMissionId) || null,
    [missions, selectedMissionId]
  );

  const handleMissionSelect = useCallback((mission: Mission) => {
    console.log('Mission selected:', mission.name, 'ID:', mission.id);
    setSelectedMissionId(mission.id || null);
  }, []);

  const handleLoad = useCallback(() => {
    console.log('Load button clicked, selected mission:', selectedMission?.name);
    if (!selectedMission) {
      Alert.alert('No Mission Selected', 'Please select a mission to load.');
      return;
    }
    
    try {
      onLoad(selectedMission);
      setSelectedMissionId(null);
    } catch (error) {
      console.error('Error in handleLoad:', error);
      Alert.alert('Error', 'Failed to load the selected mission. Please try again.');
    }
  }, [selectedMission, onLoad]);

  const handleCancel = useCallback(() => {
    setSelectedMissionId(null);
    onCancel();
  }, [onCancel]);

  const handleOverlayPress = useCallback(() => {
    // Only close on overlay press, not when clicking inside the modal
    handleCancel();
  }, [handleCancel]);

  const handleRetry = useCallback(() => {
    loadMissions();
  }, [loadMissions]);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const renderMissionItem = useCallback(({ item: mission }: { item: Mission }) => {
    const isSelected = selectedMissionId === mission.id;

    console.log('Rendering mission item:', mission.name, 'ID:', mission.id, 'Selected:', isSelected);

    return (
      <TouchableOpacity
        style={[styles.missionItem, isSelected && styles.missionItemSelected]}
        onPress={() => {
          console.log('TouchableOpacity pressed for mission:', mission.name);
          handleMissionSelect(mission);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.missionHeader}>
          <Text style={[styles.missionName, isSelected && styles.missionNameSelected]}>
            {mission.name}
          </Text>
          <Text style={[styles.missionDate, isSelected && styles.missionDateSelected]}>
            {formatDate(mission.modified_date)}
          </Text>
        </View>
        <Text style={[styles.missionDetails, isSelected && styles.missionDetailsSelected]}>
          Created: {formatDate(mission.created_date)} | ID: {mission.id}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedMissionId, handleMissionSelect, formatDate]);

  const isLoadButtonEnabled = selectedMission !== null;

  console.log('LoadMissionModal render - selectedMissionId:', selectedMissionId, 'isLoadButtonEnabled:', isLoadButtonEnabled);

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
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {isWindows ? 'Loading missions (this may take a moment on Windows)...' : 'Loading missions...'}
                </Text>
              </View>
            ) : hasError ? (
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
            ) : missions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No missions found</Text>
                <Text style={styles.emptySubtext}>Create a new mission to get started</Text>
              </View>
            ) : (
              <FlatList
                data={missions}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={renderMissionItem}
                style={styles.missionList}
                showsVerticalScrollIndicator={true}
                extraData={selectedMissionId}
                bounces={false}
                scrollEnabled={true}
                nestedScrollEnabled={!isWindows}
                removeClippedSubviews={isWindows}
                initialNumToRender={isWindows ? 5 : 10}
                maxToRenderPerBatch={isWindows ? 3 : 10}
                windowSize={isWindows ? 5 : 10}
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
