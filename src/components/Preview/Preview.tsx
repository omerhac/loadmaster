import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CargoItem, MissionSettings } from '../../types';
import { styles } from './Preview.styles';
import {
  calculateMACIndex,
  calculateMACPercent,
  calculateTotalAircraftWeight,
  calculateFuelMAC,
  calculateAdditionalWeightsMAC,
  getEmptyAircraftMACIndex,
  calculateAircraftCG,
  calculateLoadmastersIndex,
  calculateBaseWeight,
  calculateTotalFuelWeight,
  calculateCargoWeight,
  calculateCargoMACIndex,
  calculateTotalIndex,
  calculateZeroFuelWeight,
} from '../../services/mac';

interface PreviewProps {
  missionSettings: MissionSettings | null;
  items: CargoItem[];
  macPercent: number | null;
  totalWeight: number | null;
  onReturn: () => void;
}

interface CalculatedValues {
  macPercent: number;
  totalWeight: number;
  zeroFuelWeight: number;
  baseWeight: number;
  totalFuelWeight: number;
  cargoWeight: number;
  cargoMACIndex: number;
  fuelMACIndex: number;
  additionalWeightsMACIndex: number;
  emptyAircraftMACIndex: number;
  loadmastersIndex: number;
  totalIndex: number;
  aircraftCG: number;
}

const Preview = ({
  items,
  missionSettings,
}: PreviewProps) => {
  const [macIndices, setMacIndices] = useState<Record<string, number>>({});
  const [calculatedValues, setCalculatedValues] = useState<CalculatedValues | null>(null);
  const [_, setIsLoading] = useState(true);

  const onDeckItems = (items || []).filter(item => item?.status === 'onDeck');
  const onDeckItemIds = onDeckItems.map(i => i.id).join(',');

  const missionId = missionSettings?.id ? parseInt(String(missionSettings.id), 10) : null;
  const aircraftId = missionSettings?.aircraftId ? parseInt(String(missionSettings.aircraftId), 10) : null;

  useEffect(() => {
    const fetchAllCalculations = async () => {
      if (!missionId || isNaN(missionId)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch individual cargo MAC indices for display
        const indices: Record<string, number> = {};
        for (const item of onDeckItems) {
          if (item.id) {
            try {
              const itemId = parseInt(item.id, 10);
              if (!isNaN(itemId)) {
                const macIndex = await calculateMACIndex(itemId);
                indices[item.id] = macIndex;
              }
            } catch (error) {
              console.warn(`Failed to calculate MAC for item ${item.id}:`, error);
              indices[item.id] = 0;
            }
          }
        }
        setMacIndices(indices);

        // Fetch all calculations from the service
        const [
          macPercent,
          totalWeight,
          zeroFuelWeight,
          baseWeight,
          totalFuelWeight,
          cargoWeight,
          cargoMACIndex,
          fuelMACIndex,
          additionalWeightsMACIndex,
          loadmastersIndex,
          totalIndex,
        ] = await Promise.all([
          calculateMACPercent(missionId),
          calculateTotalAircraftWeight(missionId),
          calculateZeroFuelWeight(missionId),
          calculateBaseWeight(missionId),
          calculateTotalFuelWeight(missionId),
          calculateCargoWeight(missionId),
          calculateCargoMACIndex(missionId),
          calculateFuelMAC(missionId),
          calculateAdditionalWeightsMAC(missionId),
          calculateLoadmastersIndex(missionId),
          calculateTotalIndex(missionId),
        ]);

        // Get empty aircraft MAC index
        let emptyAircraftMACIndex = 0;
        if (aircraftId && !isNaN(aircraftId)) {
          try {
            emptyAircraftMACIndex = await getEmptyAircraftMACIndex(aircraftId);
          } catch (error) {
            console.warn('Failed to get empty aircraft MAC index:', error);
          }
        }

        // Calculate CG
        const aircraftCG = await calculateAircraftCG(missionId, totalIndex);

        setCalculatedValues({
          macPercent,
          totalWeight,
          zeroFuelWeight,
          baseWeight,
          totalFuelWeight,
          cargoWeight,
          cargoMACIndex,
          fuelMACIndex,
          additionalWeightsMACIndex,
          emptyAircraftMACIndex,
          loadmastersIndex,
          totalIndex,
          aircraftCG,
        });
      } catch (error) {
        console.warn('Failed to fetch calculations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCalculations();
  }, [missionId, aircraftId, onDeckItemIds, onDeckItems]);

  const getItemMACIndex = (item: CargoItem): number => {
    return item.id ? (macIndices[item.id] ?? 0) : 0;
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {return '-';}
    return num.toFixed(2);
  };

  // All values from service
  const macPercent = calculatedValues?.macPercent ?? 0;
  const totalWeight = calculatedValues?.totalWeight ?? 0;
  const zeroFuelWeight = calculatedValues?.zeroFuelWeight ?? 0;
  const baseWeight = calculatedValues?.baseWeight ?? 0;
  const totalFuelWeight = calculatedValues?.totalFuelWeight ?? 0;
  const cargoWeight = calculatedValues?.cargoWeight ?? 0;
  const cargoMACIndex = calculatedValues?.cargoMACIndex ?? 0;
  const fuelMACIndex = calculatedValues?.fuelMACIndex ?? 0;
  const additionalWeightsMACIndex = calculatedValues?.additionalWeightsMACIndex ?? 0;
  const emptyAircraftMACIndex = calculatedValues?.emptyAircraftMACIndex ?? 0;
  const loadmastersIndex = calculatedValues?.loadmastersIndex ?? 0;
  const totalIndex = calculatedValues?.totalIndex ?? 0;
  const aircraftCG = calculatedValues?.aircraftCG ?? 0;

  // Fuel distribution values from props (for breakdown display)
  const fuel = missionSettings?.fuelDistribution || { outbd: 0, inbd: 0, aux: 0, ext: 0, fuselage: 0 };
  const loadmasters = missionSettings?.loadmasters || 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Top Summary Bar */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>TAKEOFF WEIGHT</Text>
              <Text style={styles.summaryValue}>{formatNumber(totalWeight)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>MAC%</Text>
              <Text style={styles.summaryValue}>{formatNumber(macPercent)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Z.F.W</Text>
              <Text style={styles.summaryValue}>{formatNumber(zeroFuelWeight)}</Text>
            </View>
            <View style={styles.summaryCellLast}>
              <Text style={styles.summaryLabel}>CG</Text>
              <Text style={styles.summaryValue}>{formatNumber(aircraftCG)}</Text>
            </View>
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.twoColumnRow}>
          {/* Left Column */}
          <View style={styles.column}>
            {/* Flight Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Flight Info</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Mission</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{missionSettings?.name || '-'}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Date</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{missionSettings?.date || '-'}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Departure</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{missionSettings?.departureLocation || '-'}</Text>
                  </View>
                </View>
                <View style={styles.tableRowNoBorder}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Arrival</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{missionSettings?.arrivalLocation || '-'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Weight Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weight Summary</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Base Weight</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(baseWeight)}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Fuel</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(totalFuelWeight)}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Cargo</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(cargoWeight)}</Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.tableRowHighlight]}>
                  <View style={styles.labelCell}>
                    <Text style={[styles.labelText, { fontWeight: 'bold' }]}>Takeoff Weight</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueTextLarge}>{formatNumber(totalWeight)}</Text>
                  </View>
                </View>
                <View style={styles.tableRowNoBorder}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Zero Fuel Weight</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(zeroFuelWeight)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Fuel Distribution */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Fuel Distribution</Text>
              </View>
              <View style={styles.fuelTable}>
                <View style={styles.fuelHeader}>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>OUTBD</Text>
                  </View>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>INBD</Text>
                  </View>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>AUX</Text>
                  </View>
                  <View style={styles.fuelHeaderCell}>
                    <Text style={styles.fuelHeaderText}>EXT</Text>
                  </View>
                  <View style={styles.fuelHeaderCellLast}>
                    <Text style={styles.fuelHeaderText}>FUS</Text>
                  </View>
                </View>
                <View style={styles.fuelRow}>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{formatNumber(fuel.outbd)}</Text>
                  </View>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{formatNumber(fuel.inbd)}</Text>
                  </View>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{formatNumber(fuel.aux)}</Text>
                  </View>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{formatNumber(fuel.ext)}</Text>
                  </View>
                  <View style={styles.fuelCellLast}>
                    <Text style={styles.fuelText}>{formatNumber(fuel.fuselage)}</Text>
                  </View>
                </View>
                <View style={[styles.fuelRow, styles.tableRowHighlight]}>
                  <View style={[styles.fuelCell, { flex: 2 }]}>
                    <Text style={[styles.fuelText, { fontWeight: 'bold' }]}>Total Fuel</Text>
                  </View>
                  <View style={[styles.fuelCellLast, { flex: 3 }]}>
                    <Text style={[styles.fuelText, { fontWeight: 'bold', fontSize: 14 }]}>{formatNumber(totalFuelWeight)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            {/* Index Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Index Summary</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Empty Aircraft Index</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(emptyAircraftMACIndex)}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Cargo Index</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(cargoMACIndex)}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Fuel Index</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(fuelMACIndex)}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Additional Weights Index</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(additionalWeightsMACIndex)}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Loadmasters Index</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{formatNumber(loadmastersIndex)}</Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.tableRowHighlight]}>
                  <View style={styles.labelCell}>
                    <Text style={[styles.labelText, { fontWeight: 'bold' }]}>Total Index</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueTextLarge}>{formatNumber(totalIndex)}</Text>
                  </View>
                </View>
                <View style={styles.tableRowNoBorder}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Loadmasters</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{loadmasters} @ FS {missionSettings?.loadmastersFs || 0}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Cargo Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cargo Items ({onDeckItems.length})</Text>
              </View>
              {onDeckItems.length > 0 ? (
                <View style={styles.cargoTable}>
                  <View style={styles.cargoHeader}>
                    <View style={[styles.cargoHeaderCell, styles.colName]}>
                      <Text style={styles.cargoHeaderText}>Item</Text>
                    </View>
                    <View style={[styles.cargoHeaderCell, styles.colFs]}>
                      <Text style={styles.cargoHeaderText}>FS</Text>
                    </View>
                    <View style={[styles.cargoHeaderCell, styles.colWeight]}>
                      <Text style={styles.cargoHeaderText}>Weight</Text>
                    </View>
                    <View style={[styles.cargoHeaderCellLast, styles.colIndex]}>
                      <Text style={styles.cargoHeaderText}>Index</Text>
                    </View>
                  </View>
                  {onDeckItems.map((item, index) => (
                    <View key={item.id || index} style={styles.cargoRow}>
                      <View style={[styles.cargoCell, styles.colName]}>
                        <Text style={styles.cargoText} numberOfLines={1}>{item.name || '-'}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colFs]}>
                        <Text style={styles.cargoText}>{formatNumber(item.fs)}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colWeight]}>
                        <Text style={styles.cargoText}>{formatNumber(item.weight)}</Text>
                      </View>
                      <View style={[styles.cargoCellLast, styles.colIndex]}>
                        <Text style={styles.cargoText}>{formatNumber(getItemMACIndex(item))}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={[styles.cargoRow, styles.tableRowHighlight]}>
                    <View style={[styles.cargoCell, styles.colName]}>
                      <Text style={[styles.cargoText, { fontWeight: 'bold' }]}>Total</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colFs]}>
                      <Text style={styles.cargoText}>-</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colWeight]}>
                      <Text style={[styles.cargoText, { fontWeight: 'bold' }]}>{formatNumber(cargoWeight)}</Text>
                    </View>
                    <View style={[styles.cargoCellLast, styles.colIndex]}>
                      <Text style={[styles.cargoText, { fontWeight: 'bold' }]}>{formatNumber(cargoMACIndex)}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No cargo items on deck</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Preview;
