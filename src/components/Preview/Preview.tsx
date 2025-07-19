import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { CargoItem, MissionSettings } from '../../types';
import { styles } from './Preview.styles';
import { calculateCargoItemMACIndex } from '../../utils/cargoUtils';

interface PreviewProps {
  missionSettings: MissionSettings | null;
  items: CargoItem[];
  macPercent: number | null;
  totalWeight: number | null;
  onReturn: () => void;
}

// Memoized calculation functions to prevent recalculation on every render
const calculateTotalFuelWeight = (fuelDistribution: any) => {
  return fuelDistribution.outbd + 
         fuelDistribution.inbd + 
         fuelDistribution.aux + 
         fuelDistribution.ext + 
         fuelDistribution.fuselage;
};

const calculateBaseWeight = (missionSettings: MissionSettings) => {
  const aircraftEmptyWeight = missionSettings.aircraftEmptyWeight;
  const crewWeight = (missionSettings.loadmasters * 180) + (missionSettings.cockpit * 180);
  return aircraftEmptyWeight + crewWeight + missionSettings.safetyGearWeight + missionSettings.etcWeight;
};

const calculateCrewWeight = (missionSettings: MissionSettings) => {
  return (missionSettings.cockpit + missionSettings.loadmasters) * 180;
};

// Memoized table row component to prevent unnecessary re-renders
const TableRow = React.memo<{
  item: CargoItem & { macIndex: number };
  index: number;
}>(({ item, index }) => {
  const formatMACIndex = useCallback((macIndex: number) => {
    return macIndex.toFixed(3);
  }, []);

  return (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
      ]}
    >
      <Text style={[styles.tableCellText, styles.nameColumn]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.tableCellText, styles.fsColumn]}>
        {item.fs}
      </Text>
      <Text style={[styles.tableCellText, styles.weightColumn]}>
        {item.weight}
      </Text>
      <Text style={[styles.tableCellText, styles.dimensionsColumn]}>
        {item.length}"×{item.width}"×{item.height}"
      </Text>
      <Text style={[styles.tableCellText, styles.cogColumn]}>
        {item.cog}"
      </Text>
      <Text style={[styles.tableCellText, styles.macColumn]}>
        {formatMACIndex(item.macIndex)}
      </Text>
    </View>
  );
});

TableRow.displayName = 'TableRow';

const Preview = ({
  items,
  missionSettings,
  macPercent,
  totalWeight,
  onReturn,
}: PreviewProps) => {
  // Check if Windows platform for optimizations
  const isWindows = Platform.OS === 'windows';

  // Optimized MAC calculation - only for items on deck, with memoization
  const itemsOnDeckWithMAC = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const onDeckItems = items.filter(item => item.status === 'onDeck');
    
    // Batch calculate MAC indices to reduce function call overhead
    return onDeckItems.map(item => {
      try {
        return {
          ...item,
          macIndex: calculateCargoItemMACIndex(item)
        };
      } catch (error) {
        console.warn('Error calculating MAC index for item:', item.id, error);
        return {
          ...item,
          macIndex: 0
        };
      }
    });
  }, [items]);

  // Combined calculations in single useMemo to reduce redundant operations
  const cargoCalculations = useMemo(() => {
    if (!itemsOnDeckWithMAC || itemsOnDeckWithMAC.length === 0) {
      return {
        totalCargoWeight: 0,
        totalMACIndex: 0,
        itemCount: 0
      };
    }

    let totalWeight = 0;
    let totalMACIndex = 0;

    for (const item of itemsOnDeckWithMAC) {
      totalWeight += item.weight;
      totalMACIndex += item.macIndex;
    }

    return {
      totalCargoWeight: totalWeight,
      totalMACIndex: totalMACIndex,
      itemCount: itemsOnDeckWithMAC.length
    };
  }, [itemsOnDeckWithMAC]);

  // Memoized mission calculations
  const missionCalculations = useMemo(() => {
    if (!missionSettings) {
      return {
        totalFuelWeight: 0,
        baseWeight: 0,
        crewWeight: 0,
        zeroFuelWeight: 0
      };
    }

    const totalFuelWeight = calculateTotalFuelWeight(missionSettings.fuelDistribution);
    const baseWeight = calculateBaseWeight(missionSettings);
    const crewWeight = calculateCrewWeight(missionSettings);
    const zeroFuelWeight = totalWeight !== null ? totalWeight - totalFuelWeight : 0;

    return {
      totalFuelWeight,
      baseWeight,
      crewWeight,
      zeroFuelWeight
    };
  }, [missionSettings, totalWeight]);

  // Stable callback references
  const handleReturn = useCallback(() => {
    onReturn();
  }, [onReturn]);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }, []);

  const formatMACIndex = useCallback((macIndex: number) => {
    return macIndex.toFixed(3);
  }, []);

  const formatWeight = useCallback((weight: number | null) => {
    return weight !== null ? `${weight.toFixed(0)} lbs` : 'Calculating...';
  }, []);

  const formatMACPercent = useCallback((percent: number | null) => {
    return percent !== null ? `${percent.toFixed(2)}%` : 'Calculating...';
  }, []);

  // Performance optimization for Windows: limit rendering if too many items
  const shouldLimitRendering = isWindows && itemsOnDeckWithMAC.length > 50;
  const displayItems = shouldLimitRendering 
    ? itemsOnDeckWithMAC.slice(0, 50)
    : itemsOnDeckWithMAC;

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
        removeClippedSubviews={isWindows}
        scrollEventThrottle={isWindows ? 16 : undefined}
      >
        {/* Mission Info Section */}
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission Info</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Liftoff Weight:</Text>
                <Text style={styles.detailValue}>
                  {formatWeight(totalWeight)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MAC%:</Text>
                <Text style={styles.detailValue}>
                  {formatMACPercent(macPercent)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Fuel Weight:</Text>
                <Text style={styles.detailValue}>
                  {missionCalculations.totalFuelWeight} lbs
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Z.F.W (Zero Fuel Weight):</Text>
                <Text style={styles.detailValue}>
                  {formatWeight(missionCalculations.zeroFuelWeight)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cargo Weight:</Text>
                <Text style={styles.detailValue}>{cargoCalculations.totalCargoWeight} lbs</Text>
              </View>
            </View>
          </View>
        )}

        {/* Additional Info Section */}
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mission Name:</Text>
                <Text style={styles.detailValue}>{missionSettings.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(missionSettings.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Departure:</Text>
                <Text style={styles.detailValue}>{missionSettings.departureLocation}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Arrival:</Text>
                <Text style={styles.detailValue}>{missionSettings.arrivalLocation}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aircraft Index:</Text>
                <Text style={styles.detailValue}>{missionSettings.aircraftIndex}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cargo MAC Index:</Text>
                <Text style={styles.detailValue}>{formatMACIndex(cargoCalculations.totalMACIndex)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base weight:</Text>
                <Text style={styles.detailValue}>
                  {missionCalculations.baseWeight.toFixed(0)} lbs
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loadmasters:</Text>
                <Text style={styles.detailValue}>{missionSettings.loadmasters} ({missionSettings.loadmastersFs} FS)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crew Weight:</Text>
                <Text style={styles.detailValue}>{missionCalculations.crewWeight} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.foodWeight} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Safety Gear Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.safetyGearWeight} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ETC Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.etcWeight} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Configuration Weights:</Text>
                <Text style={styles.detailValue}>{missionSettings.configurationWeights} lbs</Text>
              </View>
            </View>
          </View>
        )}

        {/* Cargo Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cargo Items on Deck</Text>
          {itemsOnDeckWithMAC.length > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  Total Items: {cargoCalculations.itemCount} | Total Weight: {cargoCalculations.totalCargoWeight} lbs | Total MAC Index: {formatMACIndex(cargoCalculations.totalMACIndex)}
                </Text>
                {shouldLimitRendering && (
                  <Text style={styles.summaryText}>
                    (Showing first 50 items for performance)
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

                {/* Table Rows - Using memoized component */}
                {displayItems.map((item, index) => (
                  <TableRow 
                    key={item.id}
                    item={item}
                    index={index}
                  />
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

Preview.displayName = 'Preview';

export default Preview;
