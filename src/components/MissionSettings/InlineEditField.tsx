import React, { useState, useRef, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface InlineEditFieldProps {
  value: string | number;
  onSave: (newValue: string | number) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  placeholder?: string;
  style?: any;
  textStyle?: any;
  inputStyle?: any;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  onSave,
  keyboardType = 'default',
  placeholder,
  style,
  textStyle,
  inputStyle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handlePress = () => {
    if (!isEditing) {
      try {
        setEditValue(value.toString());
        setIsEditing(true);
      } catch (error) {
        console.error('Error starting edit mode:', error);
      }
    }
  };

  const handleSave = () => {
    try {
      let newValue: string | number;
      if (keyboardType === 'numeric') {
        const parsed = parseFloat(editValue);
        newValue = isNaN(parsed) ? 0 : parsed;
      } else {
        newValue = editValue;
      }
      
      // Only save if the value actually changed
      if (newValue !== value) {
        console.log('Saving field with new value:', newValue, 'old value:', value);
        onSave(newValue);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      handleSave();
    }
  };

  const handleSubmitEditing = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <TextInput
        ref={inputRef}
        style={[styles.input, inputStyle]}
        value={editValue}
        onChangeText={setEditValue}
        onBlur={handleSave}
        onSubmitEditing={handleSubmitEditing}
        onKeyPress={handleKeyPress}
        keyboardType={keyboardType}
        placeholder={placeholder}
        selectTextOnFocus
        autoFocus
      />
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 20,
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    color: '#333',
  },
  input: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minHeight: 20,
  },
});

export default InlineEditField;