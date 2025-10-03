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
        {/* Top Header - Mission Info */}
        <View style={styles.section}>
          <View style={{backgroundColor: '#FFD700', padding: 8, borderBottomWidth: 2, borderBottomColor: '#000'}}>
            <Text style={{fontSize: 16, fontWeight: 'bold', textAlign: 'center'}}>
              C-130 HERCULES WEIGHT AND BALANCE FORM
            </Text>
          </View>

          {/* Date and Mission Name Row */}
          <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000'}}>
            <View style={{flex: 1, padding: 8, borderRightWidth: 1, borderRightColor: '#000'}}>
              <Text style={{fontSize: 12, fontWeight: 'bold'}}>DATE</Text>
              <Text style={{fontSize: 14}}>{missionSettings?.date || 'N/A'}</Text>
            </View>
            <View style={{flex: 2, padding: 8}}>
              <Text style={{fontSize: 12, fontWeight: 'bold'}}>MISSION</Text>
              <Text style={{fontSize: 14}}>{missionSettings?.name || 'Unnamed'}</Text>
            </View>
          </View>

          {/* Route Row */}
          <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000'}}>
            <View style={{flex: 1, padding: 8, borderRightWidth: 1, borderRightColor: '#000'}}>
              <Text style={{fontSize: 12, fontWeight: 'bold'}}>FROM</Text>
              <Text style={{fontSize: 14}}>{missionSettings?.departureLocation || 'Unknown'}</Text>
            </View>
            <View style={{flex: 1, padding: 8}}>
              <Text style={{fontSize: 12, fontWeight: 'bold'}}>TO</Text>
              <Text style={{fontSize: 14}}>{missionSettings?.arrivalLocation || 'Unknown'}</Text>
            </View>
          </View>
        </View>

        {/* Weight Summary and Fuel Distribution - Side by Side */}
        <View style={{flexDirection: 'row', ...styles.section}}>
          {/* Left Column - Weight Breakdown */}
          <View style={{flex: 1, borderRightWidth: 1, borderRightColor: '#000'}}>
            <View style={{backgroundColor: '#FFD700', padding: 6, borderBottomWidth: 1, borderBottomColor: '#000'}}>
              <Text style={{fontSize: 14, fontWeight: 'bold', textAlign: 'center'}}>WEIGHT BREAKDOWN</Text>
            </View>

            <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                <Text style={{fontSize: 12, fontWeight: 'bold'}}>Basic Empty Weight</Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 14}}>{Math.round(baseWeight)} lbs</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                <Text style={{fontSize: 12, fontWeight: 'bold'}}>Crew Weight</Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 14}}>{Math.round(crewWeight)} lbs</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                <Text style={{fontSize: 12, fontWeight: 'bold'}}>Total Cargo Weight</Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 14}}>{Math.round(totalCargoWeight)} lbs</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                <Text style={{fontSize: 12, fontWeight: 'bold'}}>Total Fuel Weight</Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 14}}>{Math.round(totalFuelWeight)} lbs</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#000', backgroundColor: '#e8f4f8', height: 40}}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center'}}>
                <Text style={{fontSize: 12, fontWeight: 'bold'}}>Zero Fuel Weight (ZFW)</Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 16, fontWeight: 'bold'}}>{Math.round(zeroFuelWeight)} lbs</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#000', backgroundColor: '#fff4cc', height: 40}}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center'}}>
                <Text style={{fontSize: 13, fontWeight: 'bold'}}>TAKEOFF WEIGHT</Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>
                  {totalWeight !== null ? `${Math.round(totalWeight)} lbs` : 'N/A'}
                </Text>
              </View>
            </View>

            <Animated.View style={{
              flexDirection: 'row',
              borderBottomWidth: 2,
              borderBottomColor: '#000',
              height: 40,
              backgroundColor: isMacOutOfLimits
                ? blinkAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ff0000', '#ffcccc'],
                  })
                : '#ccffcc',
            }}>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center'}}>
                <Text style={{fontSize: 13, fontWeight: 'bold', color: isMacOutOfLimits ? '#fff' : '#000'}}>
                  MAC %
                </Text>
              </View>
              <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={{fontSize: 18, fontWeight: 'bold', color: isMacOutOfLimits ? '#fff' : '#000'}}>
                  {macPercent !== null ? `${macPercent.toFixed(2)}%` : 'N/A'}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Right Column - Fuel Distribution */}
          <View style={{flex: 1}}>
            <View style={{backgroundColor: '#FFD700', padding: 6, borderBottomWidth: 1, borderBottomColor: '#000'}}>
              <Text style={{fontSize: 14, fontWeight: 'bold', textAlign: 'center'}}>FUEL DISTRIBUTION</Text>
            </View>

            {missionSettings?.fuelDistribution && (
              <>
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>OUTBOARD</Text>
                  </View>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>{missionSettings.fuelDistribution.outbd || 0} lbs</Text>
                  </View>
                </View>
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>INBOARD</Text>
                  </View>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>{missionSettings.fuelDistribution.inbd || 0} lbs</Text>
                  </View>
                </View>
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>AUXILIARY</Text>
                  </View>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>{missionSettings.fuelDistribution.aux || 0} lbs</Text>
                  </View>
                </View>
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>EXTERNAL</Text>
                  </View>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>{missionSettings.fuelDistribution.ext || 0} lbs</Text>
                  </View>
                </View>
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#f0f0f0', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>FUSELAGE</Text>
                  </View>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center'}}>
                    <Text style={{fontSize: 12}}>{missionSettings.fuelDistribution.fuselage || 0} lbs</Text>
                  </View>
                </View>

                {/* Add spacer rows to match left column height */}
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#fafafa', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center'}}>
                    <Text style={{fontSize: 12, color: '#999'}}>---</Text>
                  </View>
                </View>
                <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#fafafa', height: 40}}>
                  <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center'}}>
                    <Text style={{fontSize: 12, color: '#999'}}>---</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Cargo Items Section */}
        <View style={styles.section}>
          <View style={{backgroundColor: '#FFD700', padding: 6, borderBottomWidth: 1, borderBottomColor: '#000'}}>
            <Text style={{fontSize: 14, fontWeight: 'bold', textAlign: 'center'}}>
              CARGO ITEMS ON DECK ({onDeckItems.length} items, {Math.round(totalCargoWeight)} lbs)
            </Text>
          </View>
          {onDeckItems.length > 0 ? (
            <View style={{borderWidth: 1, borderColor: '#000', marginTop: -1}}>
              {/* Table Header */}
              <View style={{flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 8}}>
                <Text style={{flex: 2, fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8}}>Name</Text>
                <Text style={{flex: 0.8, fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>FS</Text>
                <Text style={{flex: 0.8, fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>Weight</Text>
                <Text style={{flex: 1.5, fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>Dimensions</Text>
                <Text style={{flex: 0.8, fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>CG</Text>
              </View>

              {/* Table Rows */}
              {onDeckItems.map((item, index) => (
                <View
                  key={item.id || index}
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: index < onDeckItems.length - 1 ? 1 : 0,
                    borderBottomColor: '#ddd',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{flex: 2, fontSize: 12, paddingHorizontal: 8}} numberOfLines={1}>
                    {item.name || 'Unnamed'}
                  </Text>
                  <Text style={{flex: 0.8, fontSize: 12, textAlign: 'center'}}>
                    {item.fs || 0}
                  </Text>
                  <Text style={{flex: 0.8, fontSize: 12, textAlign: 'center'}}>
                    {item.weight || 0}
                  </Text>
                  <Text style={{flex: 1.5, fontSize: 11, textAlign: 'center'}}>
                    {item.length || 0}"×{item.width || 0}"×{item.height || 0}"
                  </Text>
                  <Text style={{flex: 0.8, fontSize: 12, textAlign: 'center'}}>
                    {item.cog || 0}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{textAlign: 'center', padding: 12, fontSize: 14, color: '#666'}}>No cargo items on deck</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Preview;
