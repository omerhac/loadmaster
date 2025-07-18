import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CargoItem, MissionSettings } from '../../types';
import { styles } from './Preview.styles';
import { validateMac, MacValidationResult } from '../../services/mac/MacValidationService';
import { calculateCargoItemMACIndex } from '../../utils/cargoUtils';

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
  const [macValidation, setMacValidation] = useState<MacValidationResult | null>(null);

  // Calculate MAC index for each item using utility function - no database calls needed
  const itemsWithMAC = useMemo(() => 
    items.map(item => ({
      ...item,
      macIndex: calculateCargoItemMACIndex(item)
    })),
    [items]
  );

  const itemsOnDeck = useMemo(() =>
    itemsWithMAC.filter(i => i.status === 'onDeck'),
    [itemsWithMAC]
  );

  const totalCargoWeight = useMemo(() =>
    itemsOnDeck.reduce((sum, item) => sum + item.weight, 0),
    [itemsOnDeck]
  );

  const totalMACIndex = useMemo(() =>
    itemsOnDeck.reduce((sum, item) => sum + item.macIndex, 0),
    [itemsOnDeck]
  );

  // Validate MAC when values are available
  useEffect(() => {
    async function validateMACValues() {
      if (totalWeight !== null && macPercent !== null) {
        try {
          const validation = await validateMac(totalWeight, macPercent);
          setMacValidation(validation);
        } catch (error) {
          console.error('Error validating MAC:', error);
          setMacValidation(null);
        }
      } else {
        setMacValidation(null);
      }
    }

    validateMACValues();
  }, [totalWeight, macPercent]);

  const handleReturn = useCallback(() => {
    onReturn();
  }, [onReturn]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatMACIndex = (macIndex: number) => {
    return macIndex.toFixed(3);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Text style={styles.returnButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mission Preview</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mission Info Section */}
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission Info</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Liftoff Weight:</Text>
                <Text style={styles.detailValue}>
                  {totalWeight !== null ? `${totalWeight.toFixed(0)} lbs` : 'Calculating...'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MAC%:</Text>
                <Text style={styles.detailValue}>
                  {macPercent !== null ? `${macPercent.toFixed(2)}%` : 'Calculating...'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Fuel Weight:</Text>
                <Text style={styles.detailValue}>
                  {(missionSettings.fuelDistribution.outbd +
                    missionSettings.fuelDistribution.inbd +
                    missionSettings.fuelDistribution.aux +
                    missionSettings.fuelDistribution.ext +
                    missionSettings.fuelDistribution.fuselage)} lbs
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Z.F.W (Zero Fuel Weight):</Text>
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
                <Text style={styles.detailValue}>{totalCargoWeight} lbs</Text>
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
                <Text style={styles.detailValue}>{formatMACIndex(totalMACIndex)}</Text>
              </View>
              {macValidation && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aircraft Weight:</Text>
                  <Text style={styles.detailValue}>{macValidation.actualWeight.toFixed(0)} lbs</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loadmasters:</Text>
                <Text style={styles.detailValue}>{missionSettings.loadmasters} ({missionSettings.loadmastersFs} FS)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crew Weight:</Text>
                <Text style={styles.detailValue}>{(missionSettings.cockpit + missionSettings.loadmasters) * 180} lbs</Text>
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
          {itemsOnDeck.length > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  Total Items: {itemsOnDeck.length} | Total Weight: {totalCargoWeight} lbs | Total MAC Index: {formatMACIndex(totalMACIndex)}
                </Text>
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
                {itemsOnDeck.map((item, index) => (
                  <View
                    key={item.id}
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
