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
  StyleSheet,
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

  const loadMissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllMissions();
      const missionsData: Mission[] = response.results.map(item => item.data as Mission);
      // Sort by modified date (most recent first)
      const sortedMissions = missionsData.sort((a, b) =>
        new Date(b.modified_date).getTime() - new Date(a.modified_date).getTime()
      );
      setMissions(sortedMissions);
      console.log('Loaded missions:', sortedMissions.length);
    } catch (error) {
      console.error('Error loading missions:', error);
      Alert.alert('Error', 'Failed to load missions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load missions when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadMissions();
      setSelectedMissionId(null); // Reset selection when modal opens
    }
  }, [visible, loadMissions]);

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
    onLoad(selectedMission);
    setSelectedMissionId(null);
  }, [selectedMission, onLoad]);

  const handleCancel = useCallback(() => {
    setSelectedMissionId(null);
    onCancel();
  }, [onCancel]);

  const handleOverlayPress = useCallback(() => {
    // Only close on overlay press, not when clicking inside the modal
    handleCancel();
  }, [handleCancel]);

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                <Text style={styles.loadingText}>Loading missions...</Text>
              </View>
            ) : missions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No missions found</Text>
                <Text style={styles.emptySubtext}>Create a new mission to get started</Text>
              </View>
            ) : (
              <FlatList
                data={missions}
                keyExtractor={(item) => item.id?.toString() || ''}
                renderItem={renderMissionItem}
                style={styles.missionList}
                showsVerticalScrollIndicator={true}
                extraData={selectedMissionId}
                bounces={false}
                scrollEnabled={true}
                nestedScrollEnabled={true}
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
