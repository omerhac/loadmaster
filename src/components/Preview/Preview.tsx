import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CargoItem, MissionSettings } from '../../types';
import { styles } from './Preview.styles';
import { calculateMACPercent } from '../../services/mac';
import { validateMac, MacValidationResult } from '../../services/mac/MacValidationService';
import { calculateTotalAircraftWeight } from '../../services/mac/MacCalculationService';

interface PreviewProps {
  missionSettings: MissionSettings | null;
  items: CargoItem[];
  missionId: number;
  onReturn: () => void;
}

type CargoItemWithMAC = CargoItem & {
  macIndex: number;
};

const Preview = ({
  items,
  missionSettings,
  missionId,
  onReturn,
}: PreviewProps) => {
  const [itemsWithMAC, setItemsWithMAC] = useState<CargoItemWithMAC[]>([]);
  const [missionMACPercent, setMissionMACPercent] = useState<number | null>(null);
  const [macValidation, setMacValidation] = useState<MacValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const itemsOnDeck = useMemo(() =>
    itemsWithMAC.filter(i => i.status === 'onDeck'),
    [itemsWithMAC]
  );

  const totalWeight = useMemo(() =>
    itemsOnDeck.reduce((sum, item) => sum + item.weight, 0),
    [itemsOnDeck]
  );

  const totalMACIndex = useMemo(() =>
    itemsOnDeck.reduce((sum, item) => sum + item.macIndex, 0),
    [itemsOnDeck]
  );

  // Calculate MAC values when component mounts or mission changes
  useEffect(() => {
    async function calculateMACValues() {
      if (!missionId) {
        return;
      }

      setIsLoading(true);
      try {
        // Calculate MAC index for each cargo item
        const itemsWithMACPromises = items.map(async (item) => {
          if (item.status === 'onDeck') {
            // For items on deck, we need to calculate MAC using the database
            // Since we don't have direct access to cargo item IDs from the database,
            // we'll calculate MAC index using the same formula as the service
            const centerX = item.position.x + (item.length / 2);
            const macIndex = (centerX - 533.46) * item.weight / 50000;
            return { ...item, macIndex };
          } else {
            return { ...item, macIndex: 0 };
          }
        });

        const calculatedItems = await Promise.all(itemsWithMACPromises);
        setItemsWithMAC(calculatedItems);

        // Calculate overall mission MAC percentage
        const missionMAC = await calculateMACPercent(missionId);
        setMissionMACPercent(missionMAC);

        // Validate MAC
        const totalAircraftWeight = await calculateTotalAircraftWeight(missionId);
        const validation = await validateMac(totalAircraftWeight, missionMAC);
        setMacValidation(validation);

      } catch (error) {
        console.error('Error calculating MAC values:', error);
        setMissionMACPercent(null);
        setMacValidation(null);
      } finally {
        setIsLoading(false);
      }
    }

    calculateMACValues();
  }, [missionId, items]);

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

  const getMACValidationColor = () => {
    if (!macValidation) {
      return '#666';
    }
    return macValidation.isValid ? '#28a745' : '#dc3545';
  };

  const getMACValidationText = () => {
    if (!macValidation) {
      return 'Unknown';
    }
    if (macValidation.isValid) {
      return `✓ Valid (${macValidation.minAllowedMac}% - ${macValidation.maxAllowedMac}%)`;
    } else {
      return `✗ Invalid (${macValidation.minAllowedMac}% - ${macValidation.maxAllowedMac}%)`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Text style={styles.returnButtonText}>← Return</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mission Preview</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mission Settings Section */}
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission Details</Text>
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
            </View>
          </View>
        )}

        {/* MAC Analysis Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MAC Analysis</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>Calculating MAC values...</Text>
          ) : (
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mission MAC Percentage:</Text>
                <Text style={styles.detailValue}>
                  {missionMACPercent !== null ? `${missionMACPercent.toFixed(2)}%` : 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MAC Status:</Text>
                <Text style={[styles.detailValue, { color: getMACValidationColor() }]}>
                  {getMACValidationText()}
                </Text>
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
            </View>
          )}
        </View>

        {/* Crew and Weights Section */}
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crew & Configuration</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loadmasters:</Text>
                <Text style={styles.detailValue}>{missionSettings.loadmasters} ({missionSettings.loadmastersFs} FS)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Safety Gear Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.safetyGearWeight} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Weight:</Text>
                <Text style={styles.detailValue}>{missionSettings.foodWeight} lbs</Text>
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

        {/* Fuel Distribution Section */}
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fuel Distribution</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Outboard:</Text>
                <Text style={styles.detailValue}>{missionSettings.fuelDistribution.outbd} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Inboard:</Text>
                <Text style={styles.detailValue}>{missionSettings.fuelDistribution.inbd} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Auxiliary:</Text>
                <Text style={styles.detailValue}>{missionSettings.fuelDistribution.aux} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>External:</Text>
                <Text style={styles.detailValue}>{missionSettings.fuelDistribution.ext} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fuselage:</Text>
                <Text style={styles.detailValue}>{missionSettings.fuelDistribution.fuselage} lbs</Text>
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
                  Total Items: {itemsOnDeck.length} | Total Weight: {totalWeight} lbs | Total MAC Index: {formatMACIndex(totalMACIndex)}
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
