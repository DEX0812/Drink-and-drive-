import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
  Vibration,
} from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import client from '@platform/shared/src/api/client';
import {
  MapPin,
  Navigation,
  ChevronUp,
  AlertTriangle,
  Car,
  Clock,
  Shield,
  Zap,
} from 'lucide-react-native';

interface Props {
  onBook: (ride: any) => void;
}

const SERVICE_TYPES = [
  {
    id: 'SAFE_RIDE',
    icon: Shield,
    label: 'Safe Ride',
    sublabel: 'Your car, our driver',
    color: '#FF3B30',
  },
  {
    id: 'DRIVE_ME',
    icon: Car,
    label: 'Drive Me',
    sublabel: 'Professional driver',
    color: '#007AFF',
  },
  {
    id: 'RIDE_HAIL',
    icon: Navigation,
    label: 'Standard',
    sublabel: 'Quick & Reliable',
    color: '#34C759',
  },
];

export default function BookingBottomSheet({ onBook }: Props) {
  const { theme, typography } = useTheme();
  const { user } = useAuth();

  const [pickupAddr, setPickupAddr] = useState('');
  const [dropoffAddr, setDropoffAddr] = useState('');
  const [selectedService, setSelectedService] = useState(0);
  const [serviceLevel, setServiceLevel] = useState<'STANDARD' | 'PREMIUM'>('STANDARD');
  const [estimate, setEstimate] = useState<any>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [booking, setBooking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ pickup: any, dropoff: any }>({
    pickup: { lat: 12.9716, lng: 77.5946 }, // Default Bangalore
    dropoff: null,
  });

  // Sheet animation
  const sheetY = useRef(new Animated.Value(0)).current;
  const COLLAPSED_HEIGHT = 160;
  const EXPANDED_HEIGHT = 560;

  const toggleSheet = () => {
    const toExpand = !expanded;
    setExpanded(toExpand);
    if (Platform.OS !== 'web') Vibration.vibrate(10);
    
    Animated.spring(sheetY, {
      toValue: toExpand ? -EXPANDED_HEIGHT + COLLAPSED_HEIGHT : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 100,
    }).start();
  };

  const handleSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') setPickupAddr(query);
    else setDropoffAddr(query);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await client.get('/rides/search-address', { params: { q: query } });
      setSuggestions(data.map((s: any) => ({ ...s, target: type })));
    } catch {
      // Ignore search errors
    } finally {
      setSearching(false);
    }
  };

  const selectSuggestion = (s: any) => {
    if (s.target === 'pickup') {
      setPickupAddr(s.name);
      setSelectedCoords(prev => ({ ...prev, pickup: { lat: s.lat, lng: s.lng } }));
    } else {
      setDropoffAddr(s.name);
      setSelectedCoords(prev => ({ ...prev, dropoff: { lat: s.lat, lng: s.lng } }));
    }
    setSuggestions([]);
  };

  const fetchEstimate = useCallback(async () => {
    if (!dropoffAddr && !expanded) return;
    
    setLoadingEstimate(true);
    try {
      // Mock coordinates for demo
      const { data } = await client.get('/rides/estimate', {
        params: {
          pickupLat: selectedCoords.pickup.lat,
          pickupLng: selectedCoords.pickup.lng,
          dropoffLat: selectedCoords.dropoff?.lat || 12.9141,
          dropoffLng: selectedCoords.dropoff?.lng || 77.6413,
          type: SERVICE_TYPES[selectedService].id,
        },
      });
      setEstimate(data);
    } catch {
      setEstimate({
        distanceKm: 9.2,
        durationMin: 28,
        estimates: { STANDARD: 185, PREMIUM: 280 },
      });
    } finally {
      setLoadingEstimate(false);
    }
  }, [selectedService, dropoffAddr, expanded]);

  useEffect(() => {
    if (expanded) fetchEstimate();
  }, [expanded, selectedService, fetchEstimate]);

  const handleBook = async () => {
    if (!dropoffAddr) {
      Alert.alert('Destination Required', 'Where would you like to go tonight?');
      return;
    }
    setBooking(true);
    try {
      const { data } = await client.post('/rides/request', {
        pickupLat: selectedCoords.pickup.lat,
        pickupLng: selectedCoords.pickup.lng,
        dropoffLat: selectedCoords.dropoff?.lat,
        dropoffLng: selectedCoords.dropoff?.lng,
        pickupAddr: pickupAddr || 'Gammel Kongevej 12, BLR',
        dropoffAddr,
        type: SERVICE_TYPES[selectedService].id,
        serviceLevel,
      });
      onBook(data.ride);
    } catch (err: any) {
      Alert.alert('System Error', 'Traffic sensors are recalibrating. Please try again in a moment.');
    } finally {
      setBooking(false);
    }
  };

  const currentService = SERVICE_TYPES[selectedService];
  const fare = estimate?.estimates?.[serviceLevel];

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          transform: [{ translateY: sheetY }],
          height: EXPANDED_HEIGHT,
        },
      ]}
    >
      {/* Visual Handle */}
      <TouchableOpacity activeOpacity={1} onPress={toggleSheet} style={styles.handleArea}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
      </TouchableOpacity>

      <View style={styles.container}>
        {/* Header Indicator */}
        <View style={styles.header}>
            <View>
                <Text style={[typography.h2, { color: theme.text, fontSize: 18, fontWeight: '800' }]}>
                    {expanded ? 'Customize Order' : 'Ride with DriveSafe'}
                </Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, fontWeight: '600' }]}>
                    {expanded ? 'Select your vehicle and professional driver' : 'Safety-first personal driver service'}
                </Text>
            </View>
            <TouchableOpacity onPress={toggleSheet} style={[styles.expandBtn, { backgroundColor: theme.surface }]}>
                <ChevronUp size={20} color={theme.text} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Service Carousel */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {SERVICE_TYPES.map((service, index) => {
              const active = selectedService === index;
              const Icon = service.icon;
              return (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => setSelectedService(index)}
                  activeOpacity={0.7}
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: active ? service.color + '15' : theme.surface,
                      borderColor: active ? service.color : theme.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: active ? service.color : theme.border + '20' }]}>
                    <Icon size={20} color={active ? '#fff' : theme.textSecondary} />
                  </View>
                  <Text style={[typography.h2, { color: active ? theme.text : theme.textSecondary, fontSize: 13, marginTop: 12 }]}>
                    {service.label}
                  </Text>
                  <Text style={[typography.body, { color: theme.textSecondary, fontSize: 9, marginTop: 2 }]} numberOfLines={1}>
                    {service.sublabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Location Orchestrator */}
          <View style={[styles.locationBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.inputGroup}>
              <View style={styles.indicatorCol}>
                <View style={[styles.circle, { backgroundColor: '#34C759' }]} />
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <View style={[styles.square, { backgroundColor: theme.text }]} />
              </View>
              <View style={styles.inputCol}>
                <TextInput
                  placeholder="Current Location"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text }]}
                  value={pickupAddr}
                  onChangeText={(t) => handleSearch(t, 'pickup')}
                />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <TextInput
                  placeholder="Where to?"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text }]}
                  value={dropoffAddr}
                  onChangeText={(t) => handleSearch(t, 'dropoff')}
                  onFocus={() => { if (!expanded) toggleSheet(); }}
                />
              </View>
            </View>

            {/* Suggestions Overlay */}
            {suggestions.length > 0 && (
              <View style={[styles.suggestionList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                 {suggestions.map((s, i) => (
                   <TouchableOpacity 
                     key={i} 
                     onPress={() => selectSuggestion(s)}
                     style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                   >
                      <MapPin size={12} color={theme.textSecondary} />
                      <View style={{ marginLeft: 12 }}>
                         <Text style={[typography.label, { color: theme.text, fontSize: 11 }]}>{s.name}</Text>
                         {s.city && <Text style={[typography.body, { color: theme.textSecondary, fontSize: 9 }]}>{s.city}, {s.country}</Text>}
                      </View>
                   </TouchableOpacity>
                 ))}
                 {searching && <ActivityIndicator size="small" style={{ marginVertical: 10 }} />}
              </View>
            )}
          </View>

          {expanded && (
            <Animated.View style={styles.expandedContent}>
              {/* Premium Selector */}
              <View style={styles.levelRow}>
                {(['STANDARD', 'PREMIUM'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setServiceLevel(level)}
                    style={[
                      styles.levelBtn,
                      {
                        backgroundColor: serviceLevel === level ? theme.text : theme.surface,
                      },
                    ]}
                  >
                    <Text style={[typography.label, { color: serviceLevel === level ? theme.background : theme.textSecondary, letterSpacing: 1 }]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Advanced Estimate Card */}
              <View style={[styles.estimateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                   {loadingEstimate ? (
                     <View style={styles.loaderBox}><ActivityIndicator color={theme.text} /></View>
                   ) : (
                     <View style={styles.estimateInner}>
                        <View>
                           <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9, letterSpacing: 1 }]}>PROJECTED FARE</Text>
                           <Text style={[typography.h1, { color: theme.text, fontSize: 32, marginTop: 4 }]}>₹{Math.round(fare || 0)}</Text>
                        </View>
                        <View style={styles.metaBox}>
                           <View style={styles.metaRow}>
                               <Navigation size={12} color={theme.textSecondary} />
                               <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginLeft: 6 }]}>{estimate?.distanceKm || '--'} km</Text>
                           </View>
                           <View style={styles.metaRow}>
                               <Clock size={12} color={theme.textSecondary} />
                               <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginLeft: 6 }]}>{estimate?.durationMin || '--'} min</Text>
                           </View>
                        </View>
                     </View>
                   )}
              </View>

              {/* Status & Action */}
              <TouchableOpacity
                onPress={handleBook}
                disabled={booking}
                activeOpacity={0.8}
                style={[styles.mainBtn, { backgroundColor: theme.text }]}
              >
                  {booking ? (
                    <ActivityIndicator color={theme.background} />
                  ) : (
                    <View style={styles.btnContent}>
                        <Zap size={18} color={theme.background} fill={theme.background} />
                        <Text style={[typography.label, { color: theme.background, fontSize: 14, marginLeft: 10, fontWeight: '900' }]}>
                           CONFIRM {currentService.label.toUpperCase()}
                        </Text>
                    </View>
                  )}
              </TouchableOpacity>
              
              <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 16, opacity: 0.6 }]}>
                 All trips are monitored by our 24/7 security dispatch team.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },
  handleArea: { alignItems: 'center', height: 24, justifyContent: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2 },
  container: { flex: 1, paddingHorizontal: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 24 },
  expandBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 40 },
  carousel: { marginBottom: 24 },
  serviceCard: { width: 130, padding: 16, borderRadius: 24, borderWidth: 1, marginRight: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locationBox: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 24 },
  inputGroup: { flexDirection: 'row' },
  indicatorCol: { width: 20, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  circle: { width: 8, height: 8, borderRadius: 4 },
  square: { width: 8, height: 8 },
  line: { width: 1, flex: 1, marginVertical: 4 },
  inputCol: { flex: 1, marginLeft: 16 },
  input: { height: 32, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  expandedContent: { marginTop: 8 },
  levelRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  levelBtn: { flex: 1, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  estimateCard: { borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 24 },
  loaderBox: { height: 60, justifyContent: 'center' },
  estimateInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaBox: { gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  mainBtn: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  suggestionList: { 
    marginTop: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    padding: 8,
    maxHeight: 200,
    overflow: 'hidden'
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth
  }
});
