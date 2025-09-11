import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from './MissionSettings.styles';
import LocationDropdown from './LocationDropdown';

interface BasicInfoSectionProps {
  name: string;
  date: string;
  departureLocation: string;
  arrivalLocation: string;
  onChange: (name: string, value: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = React.memo(({
  name,
  date,
  departureLocation,
  arrivalLocation,
  onChange,
}) => {
  // Parse date string into components
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Update local state when date prop changes
  useEffect(() => {
    if (date) {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        setDay(dateObj.getDate());
        setMonth(dateObj.getMonth() + 1); // getMonth() returns 0-11
        setYear(dateObj.getFullYear());
      }
    }
  }, [date]);

  // Format date components back to YYYY-MM-DD and call onChange
  const updateDate = useCallback((newDay: number, newMonth: number, newYear: number) => {
    const formattedDate = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    onChange('date', formattedDate);
  }, [onChange]);

  const handleDayUp = useCallback(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const newDay = day >= daysInMonth ? 1 : day + 1;
    setDay(newDay);
    updateDate(newDay, month, year);
  }, [day, month, year, updateDate]);

  const handleDayDown = useCallback(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const newDay = day <= 1 ? daysInMonth : day - 1;
    setDay(newDay);
    updateDate(newDay, month, year);
  }, [day, month, year, updateDate]);

  const handleMonthUp = useCallback(() => {
    const newMonth = month >= 12 ? 1 : month + 1;
    setMonth(newMonth);
    // Adjust day if it's invalid for the new month
    const daysInNewMonth = new Date(year, newMonth, 0).getDate();
    const adjustedDay = day > daysInNewMonth ? daysInNewMonth : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    updateDate(adjustedDay, newMonth, year);
  }, [day, month, year, updateDate]);

  const handleMonthDown = useCallback(() => {
    const newMonth = month <= 1 ? 12 : month - 1;
    setMonth(newMonth);
    // Adjust day if it's invalid for the new month
    const daysInNewMonth = new Date(year, newMonth, 0).getDate();
    const adjustedDay = day > daysInNewMonth ? daysInNewMonth : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    updateDate(adjustedDay, newMonth, year);
  }, [day, month, year, updateDate]);

  const handleYearUp = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const newYear = year >= currentYear + 10 ? currentYear - 10 : year + 1;
    setYear(newYear);
    updateDate(day, month, newYear);
  }, [day, month, year, updateDate]);

  const handleYearDown = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const newYear = year <= currentYear - 10 ? currentYear + 10 : year - 1;
    setYear(newYear);
    updateDate(day, month, newYear);
  }, [day, month, year, updateDate]);

  const handleChange = useCallback((fieldName: string, value: string) => {
    onChange(fieldName, value);
  }, [onChange]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Mission Name"
          placeholderTextColor="#999"
        />
        
        {/* Date selector with three buttons */}
        <View style={styles.dateContainer}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateRow}>
            {/* Day */}
            <View style={styles.dateGroup}>
              <TouchableOpacity style={styles.arrowButton} onPress={handleDayDown}>
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.dateValue}>{day}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={handleDayUp}>
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.dateSeparator}>/</Text>

            {/* Month */}
            <View style={styles.dateGroup}>
              <TouchableOpacity style={styles.arrowButton} onPress={handleMonthDown}>
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.dateValue}>{monthNames[month - 1]}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={handleMonthUp}>
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.dateSeparator}>/</Text>

            {/* Year */}
            <View style={styles.dateGroup}>
              <TouchableOpacity style={styles.arrowButton} onPress={handleYearDown}>
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.dateValue}>{year}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={handleYearUp}>
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>Route Information</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Departure</Text>
            <LocationDropdown
              value={departureLocation}
              onSelect={(value) => handleChange('departureLocation', value)}
              placeholder="Select departure"
            />
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Arrival</Text>
            <LocationDropdown
              value={arrivalLocation}
              onSelect={(value) => handleChange('arrivalLocation', value)}
              placeholder="Select arrival"
            />
          </View>
        </View>
      </View>
    </>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';

export default BasicInfoSection;
