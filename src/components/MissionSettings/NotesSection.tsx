import React, { useCallback } from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './MissionSettings.styles';

interface NotesSectionProps {
  notes: string | undefined;
  onChange: (name: string, value: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = React.memo(({ 
  notes, 
  onChange 
}) => {
  const handleChange = useCallback((value: string) => {
    onChange('notes', value);
  }, [onChange]);

  return (
    <View style={styles.formGroup}>
      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={styles.textArea}
        value={notes || ''}
        onChangeText={handleChange}
        placeholder="Mission Notes"
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
});

NotesSection.displayName = 'NotesSection';

export default NotesSection; 