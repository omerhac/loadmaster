import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { CargoItem, MissionSettings } from '../../types';
import { styles } from './Preview.styles';
import { validateMac } from '../../services/mac';

interface PreviewProps {
  missionSettings: MissionSettings | null;
  items: CargoItem[];
  macPercent: number | null;
  totalWeight: number | null;
  onReturn: () => void;
}

const Preview = ({
  items,
  missionSettings,
  macPercent,
  totalWeight,
  onReturn,
}: PreviewProps) => {
  const [isMacOutOfLimits, setIsMacOutOfLimits] = useState(false);
  const blinkAnimation = useRef(new Animated.Value(1)).current;

  // Check MAC limits
  useEffect(() => {
    const checkMacLimits = async () => {
      if (macPercent !== null && macPercent !== undefined && totalWeight !== null && totalWeight !== undefined) {
        try {
          const validationResult = await validateMac(totalWeight, macPercent);
          setIsMacOutOfLimits(!validationResult.isValid);
        } catch (error) {
          console.error('Error validating MAC:', error);
          setIsMacOutOfLimits(false);
        }
      } else {
        setIsMacOutOfLimits(false);
      }
    };

    checkMacLimits();
  }, [macPercent, totalWeight]);

  // Blinking animation
  useEffect(() => {
    if (isMacOutOfLimits) {
      const blinking = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(blinkAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      blinking.start();
      return () => blinking.stop();
    } else {
      blinkAnimation.setValue(1);
    }
  }, [isMacOutOfLimits, blinkAnimation]);

  // Calculate fuel weight
  let totalFuelWeight = 0;
  let zeroFuelWeight = 0;

  if (missionSettings?.fuelDistribution) {
    const fuel = missionSettings.fuelDistribution;
    totalFuelWeight = (fuel.outbd || 0) + (fuel.inbd || 0) + (fuel.aux || 0) +
                     (fuel.ext || 0) + (fuel.fuselage || 0);
    zeroFuelWeight = (totalWeight || 0) - totalFuelWeight;
  }

  // Calculate cargo weight
  const onDeckItems = items.filter(item => item.status === 'onDeck');
  const totalCargoWeight = onDeckItems.reduce((sum, item) => sum + (item.weight || 0), 0);

  // Calculate base weight and crew weight
  let baseWeight = 0;
  let crewWeight = 0;
  if (missionSettings) {
    const aircraftWeight = missionSettings.aircraftEmptyWeight || 0;
    const loadmasters = missionSettings.loadmasters || 0;
    const cockpit = missionSettings.cockpit || 0;
    crewWeight = (loadmasters + cockpit) * 180;
    baseWeight = aircraftWeight + crewWeight +
                (missionSettings.safetyGearWeight || 0) +
                (missionSettings.etcWeight || 0);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.returnButton} onPress={onReturn}>
          <Text style={styles.returnButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mission Preview</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mission Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Info</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Takeoff Weight:</Text>
              <Text style={styles.detailValue}>
                {totalWeight !== null ? `${Math.round(totalWeight)} lbs` : 'N/A'}
              </Text>
            </View>
            <Animated.View
              style={[
                styles.detailRow,
                isMacOutOfLimits && {
                  backgroundColor: blinkAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 0, 0, 0.3)', 'transparent'],
                  }),
                  borderRadius: 4,
                  paddingHorizontal: 8,
                  marginHorizontal: -8,
                },
              ]}
            >
              <Text style={[styles.detailLabel, isMacOutOfLimits && styles.alertLabel]}>MAC%:</Text>
              <Text style={[styles.detailValue, isMacOutOfLimits && styles.alertValue]}>
                {macPercent !== null ? `${macPercent.toFixed(2)}%` : 'N/A'}
              </Text>
            </Animated.View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Fuel Weight:</Text>
              <Text style={styles.detailValue}>{Math.round(totalFuelWeight)} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Z.F.W (Zero Fuel Weight):</Text>
              <Text style={styles.detailValue}>{Math.round(zeroFuelWeight)} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Cargo Weight:</Text>
              <Text style={styles.detailValue}>{Math.round(totalCargoWeight)} lbs</Text>
            </View>
          </View>
        </View>

        {/* Additional Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Info</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mission Name:</Text>
              <Text style={styles.detailValue}>{missionSettings?.name || 'Unnamed'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{missionSettings?.date || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Departure:</Text>
              <Text style={styles.detailValue}>{missionSettings?.departureLocation || 'Unknown'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Arrival:</Text>
              <Text style={styles.detailValue}>{missionSettings?.arrivalLocation || 'Unknown'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Aircraft Index:</Text>
              <Text style={styles.detailValue}>{missionSettings?.aircraftIndex || 0}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base weight:</Text>
              <Text style={styles.detailValue}>{Math.round(baseWeight)} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Loadmasters:</Text>
              <Text style={styles.detailValue}>
                {missionSettings?.loadmasters || 0} ({missionSettings?.loadmastersFs || 0} FS)
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Crew Weight:</Text>
              <Text style={styles.detailValue}>{Math.round(crewWeight)} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Food Weight:</Text>
              <Text style={styles.detailValue}>{missionSettings?.foodWeight || 0} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Safety Gear Weight:</Text>
              <Text style={styles.detailValue}>{missionSettings?.safetyGearWeight || 0} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ETC Weight:</Text>
              <Text style={styles.detailValue}>{missionSettings?.etcWeight || 0} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Configuration Weights:</Text>
              <Text style={styles.detailValue}>{missionSettings?.configurationWeights || 0} lbs</Text>
            </View>
          </View>
        </View>

        {/* Cargo Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cargo Items on Deck</Text>
          {onDeckItems.length > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  Total Items: {onDeckItems.length} | Total Weight: {Math.round(totalCargoWeight)} lbs
                </Text>
              </View>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                  <Text style={[styles.tableHeaderText, styles.fsColumn]}>FS</Text>
                  <Text style={[styles.tableHeaderText, styles.weightColumn]}>Weight</Text>
                  <Text style={[styles.tableHeaderText, styles.dimensionsColumn]}>Dimensions</Text>
                  <Text style={[styles.tableHeaderText, styles.cogColumn]}>CG</Text>
                </View>

                {/* Table Rows */}
                {onDeckItems.map((item, index) => (
                  <View
                    key={item.id || index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCellText, styles.nameColumn]} numberOfLines={2}>
                      {item.name || 'Unnamed'}
                    </Text>
                    <Text style={[styles.tableCellText, styles.fsColumn]}>
                      {item.fs || 0}
                    </Text>
                    <Text style={[styles.tableCellText, styles.weightColumn]}>
                      {item.weight || 0}
                    </Text>
                    <Text style={[styles.tableCellText, styles.dimensionsColumn]}>
                      {item.length || 0}"×{item.width || 0}"×{item.height || 0}"
                    </Text>
                    <Text style={[styles.tableCellText, styles.cogColumn]}>
                      {item.cog || 0}"
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyState}>No cargo items on deck</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Preview;
