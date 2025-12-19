import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CargoItem, MissionSettings } from '../../types';
import { styles } from './Preview.styles';
import { calculateMACIndex } from '../../services/mac';

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
}: PreviewProps) => {
  // State for MAC indices from database
  const [macIndices, setMacIndices] = useState<Record<string, number>>({});
  const [totalMACIndex, setTotalMACIndex] = useState(0);

  // Filter items that are on deck
  const onDeckItems = (items || []).filter(item => item?.status === 'onDeck');
  const onDeckItemIds = onDeckItems.map(i => i.id).join(',');

  // Calculate fuel weight
  let totalFuelWeight = 0;
  let zeroFuelWeight = 0;
  if (missionSettings?.fuelDistribution) {
    const fuel = missionSettings.fuelDistribution;
    totalFuelWeight = (fuel.outbd || 0) + (fuel.inbd || 0) + (fuel.aux || 0) +
                     (fuel.ext || 0) + (fuel.fuselage || 0);
    zeroFuelWeight = totalWeight !== null ? totalWeight - totalFuelWeight : 0;
  }

  // Calculate cargo weight
  const totalCargoWeight = onDeckItems.reduce((sum, item) => sum + (item.weight || 0), 0);

  // Fetch MAC indices from database
  useEffect(() => {
    const fetchMACIndices = async () => {
      const indices: Record<string, number> = {};
      let total = 0;

      for (const item of onDeckItems) {
        if (item.id) {
          try {
            const itemId = parseInt(item.id, 10);
            if (!isNaN(itemId)) {
              const macIndex = await calculateMACIndex(itemId);
              indices[item.id] = macIndex;
              total += macIndex;
            }
          } catch (error) {
            console.warn(`Failed to calculate MAC for item ${item.id}:`, error);
            indices[item.id] = 0;
          }
        }
      }

      setMacIndices(indices);
      setTotalMACIndex(total);
    };

    fetchMACIndices();
  }, [onDeckItems, onDeckItemIds]);

  // Get MAC index for an item (from state or 0 if not yet calculated)
  const getItemMACIndex = (item: CargoItem): number => {
    return item.id ? (macIndices[item.id] ?? 0) : 0;
  };

  // Calculate crew and base weight
  const loadmasters = missionSettings?.loadmasters || 0;
  const cockpit = missionSettings?.cockpit || 0;
  const crewWeight = (loadmasters + cockpit) * 180;
  const baseWeight = (missionSettings?.aircraftEmptyWeight || 0) + crewWeight +
                    (missionSettings?.safetyGearWeight || 0) +
                    (missionSettings?.etcWeight || 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Mission Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Info</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mission Name:</Text>
              <Text style={styles.detailValue}>{missionSettings?.name || 'No mission'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Takeoff Weight:</Text>
              <Text style={styles.detailValue}>{totalWeight?.toFixed(0) || 'N/A'} lbs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MAC%:</Text>
              <Text style={styles.detailValue}>{macPercent?.toFixed(2) || 'N/A'}%</Text>
            </View>
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
        {missionSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{missionSettings.date || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Departure:</Text>
                <Text style={styles.detailValue}>{missionSettings.departureLocation || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Arrival:</Text>
                <Text style={styles.detailValue}>{missionSettings.arrivalLocation || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aircraft Index:</Text>
                <Text style={styles.detailValue}>{missionSettings.aircraftIndex || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cargo MAC Index:</Text>
                <Text style={styles.detailValue}>{totalMACIndex.toFixed(3)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base Weight:</Text>
                <Text style={styles.detailValue}>{Math.round(baseWeight)} lbs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loadmasters:</Text>
                <Text style={styles.detailValue}>
                  {missionSettings.loadmasters || 0} ({missionSettings.loadmastersFs || 0} FS)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crew Weight:</Text>
                <Text style={styles.detailValue}>{Math.round(crewWeight)} lbs</Text>
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
        )}

        {/* Cargo Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cargo Items on Deck ({onDeckItems.length})</Text>
          {onDeckItems.length > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  Total Items: {onDeckItems.length} | Total Weight: {Math.round(totalCargoWeight)} lbs | Total MAC Index: {totalMACIndex.toFixed(3)}
                </Text>
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                  <Text style={[styles.tableHeaderText, styles.fsColumn]}>FS</Text>
                  <Text style={[styles.tableHeaderText, styles.weightColumn]}>Weight</Text>
                  <Text style={[styles.tableHeaderText, styles.dimensionsColumn]}>Dimensions</Text>
                  <Text style={[styles.tableHeaderText, styles.cogColumn]}>COG</Text>
                  <Text style={[styles.tableHeaderText, styles.macColumn]}>MAC Index</Text>
                </View>
                {onDeckItems.map((item, index) => (
                  <View
                    key={item.id || index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCellText, styles.nameColumn]} numberOfLines={2}>{item.name || 'Unnamed'}</Text>
                    <Text style={[styles.tableCellText, styles.fsColumn]}>{item.fs || 0}</Text>
                    <Text style={[styles.tableCellText, styles.weightColumn]}>{item.weight || 0}</Text>
                    <Text style={[styles.tableCellText, styles.dimensionsColumn]}>
                      {item.length || 0}"×{item.width || 0}"×{item.height || 0}"
                    </Text>
                    <Text style={[styles.tableCellText, styles.cogColumn]}>{item.cog || 0}"</Text>
                    <Text style={[styles.tableCellText, styles.macColumn]}>{getItemMACIndex(item).toFixed(3)}</Text>
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
