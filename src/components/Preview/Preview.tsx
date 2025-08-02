
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
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

// Safe MAC calculation with error handling
const safeCalculateMAC = (item: CargoItem): number => {
  try {
    if (!item || item.status !== 'onDeck' || !item.position || typeof item.position.x !== 'number') {
      return 0;
    }

    const length = typeof item.length === 'number' ? item.length : 0;
    const weight = typeof item.weight === 'number' ? item.weight : 0;

    if (length <= 0 || weight <= 0) {
      return 0;
    }

    const centerX = item.position.x + (length / 2);
    const macIndex = (centerX - 533.46) * weight / 50000;

    return isFinite(macIndex) ? macIndex : 0;
  } catch (error) {
    console.warn('MAC calculation error for item:', item?.id, error);
    return 0;
  }
};

// Simple state management following MissionSettings pattern
type PreviewState = {
  processedItems: Array<CargoItem & { macIndex: number }>;
  calculations: {
    totalCargoWeight: number;
    totalMACIndex: number;
    itemCount: number;
    totalFuelWeight: number;
    baseWeight: number;
    crewWeight: number;
    zeroFuelWeight: number;
  };
  isProcessing: boolean;
};

const DEFAULT_STATE: PreviewState = {
  processedItems: [],
  calculations: {
    totalCargoWeight: 0,
    totalMACIndex: 0,
    itemCount: 0,
    totalFuelWeight: 0,
    baseWeight: 0,
    crewWeight: 0,
    zeroFuelWeight: 0,
  },
  isProcessing: false,
};

const Preview = ({
  items,
  missionSettings,
  macPercent,
  totalWeight,
  onReturn,
}: PreviewProps) => {
  // Single state object like MissionSettings
  const [state, setState] = useState<PreviewState>(DEFAULT_STATE);

  // Check if Windows platform for optimizations
  const isWindows = Platform.OS === 'windows';

  // Single update handler like MissionSettings
  const updateState = useCallback((updates: Partial<PreviewState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  const [isMacOutOfLimits, setIsMacOutOfLimits] = useState(false);
  const blinkAnimation = useRef(new Animated.Value(1)).current;

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

  // Process data safely with error handling
  const processData = useCallback(() => {
    try {
      updateState({ isProcessing: true });

      // Filter and process items safely
      const onDeckItems = (items || []).filter(item =>
        item && typeof item === 'object' && item.status === 'onDeck'
      );

      // Limit items on Windows for performance
      const itemsToProcess = isWindows && onDeckItems.length > 20
        ? onDeckItems.slice(0, 20)
        : onDeckItems;

      // Process items with safe MAC calculation
      const processedItems = itemsToProcess.map(item => ({
        ...item,
        macIndex: safeCalculateMAC(item),
      }));

      // Calculate totals safely
      let totalCargoWeight = 0;
      let totalMACIndex = 0;

      for (const item of processedItems) {
        if (typeof item.weight === 'number' && item.weight > 0) {
          totalCargoWeight += item.weight;
        }
        if (typeof item.macIndex === 'number' && isFinite(item.macIndex)) {
          totalMACIndex += item.macIndex;
        }
      }

      // Mission calculations with safe defaults
      let totalFuelWeight = 0;
      let baseWeight = 0;
      let crewWeight = 0;
      let zeroFuelWeight = 0;

      if (missionSettings) {
        try {
          const fuel = missionSettings.fuelDistribution || {};
          totalFuelWeight = (fuel.outbd || 0) + (fuel.inbd || 0) + (fuel.aux || 0) +
                           (fuel.ext || 0) + (fuel.fuselage || 0);

          const aircraftWeight = missionSettings.aircraftEmptyWeight || 0;
          const loadmasters = missionSettings.loadmasters || 0;
          const cockpit = missionSettings.cockpit || 0;
          crewWeight = (loadmasters + cockpit) * 180;

          baseWeight = aircraftWeight + crewWeight +
                      (missionSettings.safetyGearWeight || 0) +
                      (missionSettings.etcWeight || 0);

          zeroFuelWeight = totalWeight !== null ? totalWeight - totalFuelWeight : 0;
        } catch (error) {
          console.warn('Mission calculations error:', error);
        }
      }

      updateState({
        processedItems,
        calculations: {
          totalCargoWeight,
          totalMACIndex,
          itemCount: processedItems.length,
          totalFuelWeight,
          baseWeight,
          crewWeight,
          zeroFuelWeight,
        },
        isProcessing: false,
      });

    } catch (error) {
      console.warn('Preview data processing error:', error);
      updateState({
        processedItems: [],
        calculations: DEFAULT_STATE.calculations,
        isProcessing: false,
      });
    }
  }, [items, missionSettings, totalWeight, isWindows, updateState]);

  // Process data when inputs change
  useEffect(() => {
    processData();
  }, [processData]);

  // Stable callback references
  const handleReturn = useCallback(() => {
    onReturn();
  }, [onReturn]);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString || 'Unknown date';
    }
  }, []);

  const formatWeight = useCallback((weight: number | null) => {
    return weight !== null ? `${Math.round(weight)} lbs` : 'Calculating...';
  }, []);

  const formatMACPercent = useCallback((percent: number | null) => {
    return percent !== null ? `${percent.toFixed(2)}%` : 'Calculating...';
  }, []);

  const formatMACIndex = useCallback((macIndex: number) => {
    return isFinite(macIndex) ? macIndex.toFixed(3) : '0.000';
  }, []);

  // Simple table row component
  const renderTableRow = useCallback((item: CargoItem & { macIndex: number }, index: number) => (
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
      <Text style={[styles.tableCellText, styles.macColumn]}>
        {formatMACIndex(item.macIndex)}
      </Text>
    </View>
  ), [formatMACIndex]);

  const { processedItems, calculations } = state;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Text style={styles.returnButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mission Preview</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mission Info Section */}
        {missionSettings ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission Info</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Liftoff Weight:</Text>
                <Text style={styles.detailValue}>{formatWeight(totalWeight)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MAC%:</Text>
                <Text style={styles.detailValue}>{formatMACPercent(macPercent)}</Text>
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
                  {macPercent !== null ? `${macPercent.toFixed(2)}%` : 'Calculating...'}
                </Text>
              </Animated.View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Fuel Weight:</Text>
                <Text style={styles.detailValue}>{Math.round(calculations.totalFuelWeight)} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Z.F.W (Zero Fuel Weight):</Text>
                <Text style={styles.detailValue}>{formatWeight(calculations.zeroFuelWeight)}</Text>
                <Text style={styles.detailValue}>
                  {totalWeight !== null ?
                    `${(totalWeight - (missionSettings.fuelDistribution.outbd +
                      missionSettings.fuelDistribution.inbd +
                      missionSettings.fuelDistribution.aux +
                      missionSettings.fuelDistribution.ext +
                      missionSettings.fuelDistribution.fuselage)).toFixed(0)} lbs` :
                    'Calculating...'
                  }
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cargo Weight:</Text>
                <Text style={styles.detailValue}>{Math.round(calculations.totalCargoWeight)} lbs</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission Info</Text>
            <Text style={styles.emptyState}>Mission settings not available</Text>
          </View>
        )}

        {/* Additional Info Section */}
        {missionSettings ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mission Name:</Text>
                <Text style={styles.detailValue}>{missionSettings.name || 'Unnamed'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(missionSettings.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Departure:</Text>
                <Text style={styles.detailValue}>{missionSettings.departureLocation || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Arrival:</Text>
                <Text style={styles.detailValue}>{missionSettings.arrivalLocation || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aircraft Index:</Text>
                <Text style={styles.detailValue}>{missionSettings.aircraftIndex || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cargo MAC Index:</Text>
                <Text style={styles.detailValue}>{formatMACIndex(calculations.totalMACIndex)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base weight:</Text>
                <Text style={styles.detailValue}>{Math.round(calculations.baseWeight)} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loadmasters:</Text>
                <Text style={styles.detailValue}>
                  {missionSettings.loadmasters || 0} ({missionSettings.loadmastersFs || 0} FS)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crew Weight:</Text>
                <Text style={styles.detailValue}>{Math.round(calculations.crewWeight)} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.foodWeight || 0} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Safety Gear Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.safetyGearWeight || 0} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ETC Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.etcWeight || 0} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Configuration Weights:</Text>
                <Text style={styles.detailValue}>{missionSettings.configurationWeights || 0} lbs</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            <Text style={styles.emptyState}>Mission settings not available</Text>
          </View>
        )}

        {/* Cargo Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cargo Items on Deck</Text>
          {processedItems.length > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  Total Items: {calculations.itemCount} | Total Weight: {Math.round(calculations.totalCargoWeight)} lbs | Total MAC Index: {formatMACIndex(calculations.totalMACIndex)}
                </Text>
                {isWindows && items && items.length > 20 && (
                  <Text style={styles.summaryText}>
                    (Showing first 20 items for Windows performance)
                  </Text>
                )}
              </View>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                  <Text style={[styles.tableHeaderText, styles.fsColumn]}>FS</Text>
                  <Text style={[styles.tableHeaderText, styles.weightColumn]}>Weight</Text>
                  <Text style={[styles.tableHeaderText, styles.dimensionsColumn]}>Dimensions</Text>
                  <Text style={[styles.tableHeaderText, styles.cogColumn]}>CoG</Text>
                  <Text style={[styles.tableHeaderText, styles.macColumn]}>MAC Index</Text>
                </View>

                {/* Table Rows */}
                {processedItems.map(renderTableRow)}
              </View>
            </>
          ) : (
            <Text style={styles.emptyState}>
              {state.isProcessing ? 'Processing cargo items...' : 'No cargo items on deck'}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Preview;
