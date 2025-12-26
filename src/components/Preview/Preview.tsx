import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image as RNImage } from 'react-native';
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
import { MACGraph, AREAGraph } from '../Graphs';
import { Images } from '../../assets';

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

  const onDeckItems = (items || []).filter(item => item?.status === 'onDeck');
  const onDeckItemIds = onDeckItems.map(i => i.id).join(',');

  const missionId = missionSettings?.id ? parseInt(String(missionSettings.id), 10) : null;
  const aircraftId = missionSettings?.aircraftId ? parseInt(String(missionSettings.aircraftId), 10) : null;

  useEffect(() => {
    let cancelled = false;

    const fetchAllCalculations = async () => {
      if (!missionId || isNaN(missionId)) {return;}

      try {
        const indices: Record<string, number> = {};
        const currentDeckItems = (items || []).filter(item => item?.status === 'onDeck');
        for (const item of currentDeckItems) {
          if (item.id && !cancelled) {
            try {
              const itemId = parseInt(item.id, 10);
              if (!isNaN(itemId)) {
                indices[item.id] = await calculateMACIndex(itemId);
              }
            } catch {
              indices[item.id] = 0;
            }
          }
        }
        if (cancelled) {return;}
        setMacIndices(indices);

        const results = await Promise.all([
          calculateMACPercent(missionId).catch(() => 0),
          calculateTotalAircraftWeight(missionId).catch(() => 0),
          calculateZeroFuelWeight(missionId).catch(() => 0),
          calculateBaseWeight(missionId).catch(() => 0),
          calculateTotalFuelWeight(missionId).catch(() => 0),
          calculateCargoWeight(missionId).catch(() => 0),
          calculateCargoMACIndex(missionId).catch(() => 0),
          calculateFuelMAC(missionId).catch(() => 0),
          calculateAdditionalWeightsMAC(missionId).catch(() => 0),
          calculateLoadmastersIndex(missionId).catch(() => 0),
          calculateTotalIndex(missionId).catch(() => 0),
        ]);

        if (cancelled) {return;}

        const [
          macPercent, totalWeight, zeroFuelWeight, baseWeight,
          totalFuelWeight, cargoWeight, cargoMACIndex, fuelMACIndex,
          additionalWeightsMACIndex, loadmastersIndex, totalIndex,
        ] = results;

        let emptyAircraftMACIndex = 0;
        if (aircraftId && !isNaN(aircraftId)) {
          try { emptyAircraftMACIndex = await getEmptyAircraftMACIndex(aircraftId); } catch { /* ignore */ }
        }

        if (cancelled) {return;}

        let aircraftCG = 0;
        try { aircraftCG = await calculateAircraftCG(missionId, totalIndex); } catch { /* ignore */ }

        if (cancelled) {return;}

        setCalculatedValues({
          macPercent, totalWeight, zeroFuelWeight, baseWeight, totalFuelWeight,
          cargoWeight, cargoMACIndex, fuelMACIndex, additionalWeightsMACIndex,
          emptyAircraftMACIndex, loadmastersIndex, totalIndex, aircraftCG,
        });
      } catch (error) {
        console.warn('Failed to fetch calculations:', error);
      }
    };

    fetchAllCalculations();

    return () => { cancelled = true; };
  }, [missionId, aircraftId, onDeckItemIds, items]);

  const getItemMACIndex = (item: CargoItem): number => {
    return item.id ? (macIndices[item.id] ?? 0) : 0;
  };

  const fmt = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {return '-';}
    return num.toFixed(2);
  };

  const cv = calculatedValues;
  const fuel = missionSettings?.fuelDistribution || { outbd: 0, inbd: 0, aux: 0, ext: 0, fuselage: 0 };

  // Calculate cumulative indices
  const emptyIdx = cv?.emptyAircraftMACIndex ?? 0;
  const additionalIdx = cv?.additionalWeightsMACIndex ?? 0;
  const loadmastersIdx = cv?.loadmastersIndex ?? 0;
  const baseIdx = emptyIdx + additionalIdx + loadmastersIdx;
  const fuelIdx = cv?.fuelMACIndex ?? 0;
  const cargoIdx = cv?.cargoMACIndex ?? 0;

  // Cumulative totals
  let cumulative = 0;
  const emptyCum = (cumulative += emptyIdx);
  const loadmastersCum = (cumulative += loadmastersIdx);
  const baseCum = loadmastersCum;
  const fuelCum = (cumulative += fuelIdx);
  const cargoCum = (cumulative += cargoIdx);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.twoColumnRow}>
          {/* Left Column - Weight & Index + Cargo */}
          <View style={styles.column}>
            {/* Weight Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weight & Index</Text>
              </View>
              <View style={styles.weightTable}>
                <View style={styles.weightHeader}>
                  <View style={[styles.weightHeaderCell, styles.colName]}>
                    <Text style={styles.weightHeaderText}>Item</Text>
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colFs]}>
                    <Text style={styles.weightHeaderText} />
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colWeight]}>
                    <Text style={styles.weightHeaderText}>Weight(lb)</Text>
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colIndex]}>
                    <Text style={styles.weightHeaderText}>Idx</Text>
                  </View>
                  <View style={[styles.weightHeaderCell, styles.colCum]}>
                    <Text style={styles.weightHeaderText}>Cumulative</Text>
                  </View>
                  <View style={[styles.weightHeaderCellLast, styles.colAction]}>
                    <Text style={styles.weightHeaderText} />
                  </View>
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Empty Aircraft</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(missionSettings?.aircraftEmptyWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(emptyIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(emptyCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Configuration</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(missionSettings?.configurationWeights)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Crew Gear</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(missionSettings?.crewGearWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Food</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(missionSettings?.foodWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Safety Gear</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(missionSettings?.safetyGearWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>ETC</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(missionSettings?.etcWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>-</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Loadmasters ({missionSettings?.loadmasters || 0})</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt((missionSettings?.loadmasters || 0) * 170)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(loadmastersIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(loadmastersCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={[styles.weightRow, styles.weightRowHighlight]}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightTextBold}>Base Weight</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={[styles.weightTextCenter, { fontWeight: 'bold' }]}>{fmt(cv?.baseWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={[styles.weightTextCenter, { fontWeight: 'bold' }]}>{fmt(baseIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={[styles.weightTextCenter, { fontWeight: 'bold' }]}>{fmt(baseCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

                <View style={styles.weightRow}>
                  <View style={[styles.weightCell, styles.colName]}>
                    <Text style={styles.weightText}>Fuel</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colFs]}>
                    <Text style={styles.weightTextCenter} />
                  </View>
                  <View style={[styles.weightCell, styles.colWeight]}>
                    <Text style={styles.weightTextCenter}>{fmt(cv?.totalFuelWeight)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colIndex]}>
                    <Text style={styles.weightTextCenter}>{fmt(fuelIdx)}</Text>
                  </View>
                  <View style={[styles.weightCell, styles.colCum]}>
                    <Text style={styles.weightTextCenter}>{fmt(fuelCum)}</Text>
                  </View>
                  <View style={[styles.weightCellLast, styles.colAction]} />
                </View>

              </View>
            </View>

            {/* Cargo Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cargo ({onDeckItems.length})</Text>
              </View>
              <View style={styles.cargoTable}>
                <View style={styles.cargoHeader}>
                  <View style={[styles.cargoHeaderCell, styles.colName]}>
                    <Text style={styles.cargoHeaderText}>Item</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colFs]}>
                    <Text style={styles.cargoHeaderText}>FS</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colWeight]}>
                    <Text style={styles.cargoHeaderText}>Weight(lb)</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colIndex]}>
                    <Text style={styles.cargoHeaderText}>Idx</Text>
                  </View>
                  <View style={[styles.cargoHeaderCell, styles.colCum]}>
                    <Text style={styles.cargoHeaderText}>Cumulative</Text>
                  </View>
                  <View style={[styles.cargoHeaderCellLast, styles.colAction]}>
                    <Text style={styles.cargoHeaderText} />
                  </View>
                </View>

                {onDeckItems.map((item, index) => {
                  // Calculate cumulative index up to this item
                  let itemCumIdx = fuelCum;
                  for (let i = 0; i <= index; i++) {
                    itemCumIdx += getItemMACIndex(onDeckItems[i]);
                  }
                  return (
                    <View key={item.id || index} style={styles.cargoRow}>
                      <View style={[styles.cargoCell, styles.colName]}>
                        <Text style={styles.cargoText} numberOfLines={1}>{item.name || '-'}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colFs]}>
                        <Text style={styles.cargoText}>{fmt(item.fs)}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colWeight]}>
                        <Text style={styles.cargoText}>{fmt(item.weight)}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colIndex]}>
                        <Text style={styles.cargoText}>{fmt(getItemMACIndex(item))}</Text>
                      </View>
                      <View style={[styles.cargoCell, styles.colCum]}>
                        <Text style={styles.cargoText}>{fmt(itemCumIdx)}</Text>
                      </View>
                      <View style={[styles.cargoCellLast, styles.colAction]} />
                    </View>
                  );
                })}

                {onDeckItems.length > 0 && (
                  <View style={[styles.cargoRow, { backgroundColor: '#f0f0f0' }]}>
                    <View style={[styles.cargoCell, styles.colName]}>
                      <Text style={styles.weightTextBold}>Cargo Total</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colFs]}>
                      <Text style={styles.cargoText}>-</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colWeight]}>
                      <Text style={styles.weightTextBold}>{fmt(cv?.cargoWeight)}</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colIndex]}>
                      <Text style={styles.weightTextBold}>{fmt(cargoIdx)}</Text>
                    </View>
                    <View style={[styles.cargoCell, styles.colCum]}>
                      <Text style={styles.weightTextBold}>{fmt(cargoCum)}</Text>
                    </View>
                    <View style={[styles.cargoCellLast, styles.colAction]} />
                  </View>
                )}

                {/* Total Weight Summary */}
                <View style={[styles.cargoRow, styles.weightRowHighlight]}>
                  <View style={[styles.cargoCell, styles.colName]}>
                    <Text style={styles.weightTextBold}>Total Weight</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colFs]}>
                    <Text style={styles.cargoText}>-</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colWeight]}>
                    <Text style={[styles.weightTextBold, { fontSize: 13 }]}>{fmt(cv?.totalWeight)}</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colIndex]}>
                    <Text style={styles.cargoText}>-</Text>
                  </View>
                  <View style={[styles.cargoCell, styles.colCum]}>
                    <Text style={styles.weightTextBold}>{fmt(cargoCum)}</Text>
                  </View>
                  <View style={[styles.cargoCellLast, styles.colAction]} />
                </View>

                {/* MAC% Display */}
                <View style={{ backgroundColor: '#FFE135', padding: 8, alignItems: 'center', borderTopWidth: 2, borderTopColor: '#000' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                    MAC: {fmt(cv?.macPercent)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column - Flight Info & Fuel */}
          <View style={styles.columnSmall}>
            {/* Flight Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Flight Info</Text>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Mission</Text>
                <View style={styles.formValue}>
                  <Text style={styles.weightText}>{missionSettings?.name || '-'}</Text>
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Date</Text>
                <View style={styles.formValue}>
                  <Text style={styles.weightText}>{missionSettings?.date || '-'}</Text>
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Departure</Text>
                <View style={styles.formValue}>
                  <Text style={styles.weightText}>{missionSettings?.departureLocation || '-'}</Text>
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Arrival</Text>
                <View style={styles.formValue}>
                  <Text style={styles.weightText}>{missionSettings?.arrivalLocation || '-'}</Text>
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
                    <Text style={styles.fuelText}>{fmt(fuel.outbd)}</Text>
                  </View>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{fmt(fuel.inbd)}</Text>
                  </View>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{fmt(fuel.aux)}</Text>
                  </View>
                  <View style={styles.fuelCell}>
                    <Text style={styles.fuelText}>{fmt(fuel.ext)}</Text>
                  </View>
                  <View style={styles.fuelCellLast}>
                    <Text style={styles.fuelText}>{fmt(fuel.fuselage)}</Text>
                  </View>
                </View>
                <View style={[styles.fuelRow, styles.weightRowHighlight]}>
                  <View style={[styles.fuelCell, { flex: 2 }]}>
                    <Text style={[styles.fuelText, { fontWeight: 'bold' }]}>Total</Text>
                  </View>
                  <View style={[styles.fuelCellLast, { flex: 3 }]}>
                    <Text style={[styles.fuelText, { fontWeight: 'bold' }]}>{fmt(cv?.totalFuelWeight)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Fuel Pods</Text>
                <Text style={styles.weightText}>{missionSettings?.fuelPods ? 'Yes' : 'No'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Graphs Section */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 40, paddingBottom: 80 }}>
            <View style={{ marginHorizontal: 20 }}>
              <MACGraph
                macPercent={cv?.macPercent ?? 0}
                weight={cv?.totalWeight ?? 0}
                imageSource={Images.mac}
                width={280}
                height={280}
              />
            </View>
            <View style={{ marginHorizontal: 20 }}>
              <AREAGraph
                imageSource={Images.area}
                width={280}
                height={280}
                baseWeight={cv?.baseWeight ?? 0}
                fuelWeight={cv?.totalFuelWeight ?? 0}
                cargoWeight={cv?.cargoWeight ?? 0}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Preview;
