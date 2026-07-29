import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, SafeAreaView, Text, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import { Button, Heading } from '@platform/shared/src/components/Core';
import { Navigation, MapPin, Car, Shield, CheckCircle } from 'lucide-react-native';
import client from '@platform/shared/src/api/client';
import io from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://192.168.31.70:4000';

const PRESETS = [
  {
    id: '1',
    label: 'Home to Office',
    pickup: 'Indiranagar, Bengaluru',
    pickupCoords: { lat: 12.9716, lng: 77.6413 },
    dropoff: 'Electronic City, Bengaluru',
    dropoffCoords: { lat: 12.8399, lng: 77.6770 },
  },
  {
    id: '2',
    label: 'Hotel to Airport',
    pickup: 'MG Road, Bengaluru',
    pickupCoords: { lat: 12.9784, lng: 77.6061 },
    dropoff: 'Kempegowda Int Airport (BLR)',
    dropoffCoords: { lat: 13.1986, lng: 77.7066 },
  },
  {
    id: '3',
    label: 'Club to Home',
    pickup: 'Koramangala 100ft Rd, Bengaluru',
    pickupCoords: { lat: 12.9345, lng: 77.6256 },
    dropoff: 'Whitefield, Bengaluru',
    dropoffCoords: { lat: 12.9698, lng: 77.7500 },
  }
];

interface Props {
  onStartBooking: (requestDetails: any) => void;
}

export default function HomeScreen({ onStartBooking }: Props) {
  const { theme, typography, mode } = useTheme();
  const { user } = useAuth();
  
  const mapRef = useRef<MapView>(null);
  const [pickup, setPickup] = useState('Indiranagar, Bengaluru');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ lat: 12.9716, lng: 77.6413 });
  const [dropoffCoords, setDropoffCoords] = useState<any>(null);
  
  const [vehicle, setVehicle] = useState<any>(null);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    fetchVehicleProfile();
  }, []);

  const fetchVehicleProfile = async () => {
    setLoadingVehicle(true);
    try {
      // Look up rider vehicles
      const { data } = await client.get('/vehicles');
      if (data && data.length > 0) {
        setVehicle(data[0]);
      } else {
        // Fallback vehicle from user profile / registration payload
        if (user && (user as any).vehicle) {
          setVehicle((user as any).vehicle);
        } else {
          setVehicle({
            make: 'Premium',
            model: 'Sedan',
            transmissionType: 'AUTOMATIC',
            plateNo: 'KA-01-XX-9999',
          });
        }
      }
    } catch {
      // Mock vehicle if network is offline
      setVehicle({
        make: 'Honda',
        model: 'Civic',
        transmissionType: 'AUTOMATIC',
        plateNo: 'KA-03-MD-5582',
      });
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setPickup(preset.pickup);
    setDropoff(preset.dropoff);
    setPickupCoords(preset.pickupCoords);
    setDropoffCoords(preset.dropoffCoords);
    setEstimate(null);
    
    mapRef.current?.animateToRegion({
      latitude: (preset.pickupCoords.lat + preset.dropoffCoords.lat) / 2,
      longitude: (preset.pickupCoords.lng + preset.dropoffCoords.lng) / 2,
      latitudeDelta: Math.abs(preset.pickupCoords.lat - preset.dropoffCoords.lat) * 1.5 || 0.05,
      longitudeDelta: Math.abs(preset.pickupCoords.lng - preset.dropoffCoords.lng) * 1.5 || 0.05,
    }, 1000);
  };

  const handleGetEstimate = async () => {
    if (!dropoff) {
      Alert.alert('Destination Required', 'Please enter a dropoff destination.');
      return;
    }
    setLoadingEstimate(true);
    try {
      const { data } = await client.get('/rides/estimate', {
        params: {
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          dropoffLat: dropoffCoords?.lat || 12.9698,
          dropoffLng: dropoffCoords?.lng || 77.7500,
        }
      });
      // The old backend returns estimates object or directly price
      const price = data.estimates?.STANDARD || data.price || 250;
      setEstimate(price);
    } catch (err) {
      // Mock estimate on connection failure
      const randomFare = Math.floor(Math.random() * 150) + 200;
      setEstimate(randomFare);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const handleBook = async () => {
    setSubmitting(true);
    try {
      const payload = {
        vehicleId: vehicle?.id || 'mock-vehicle-id',
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        pickupAddress: pickup,
        dropoffLat: dropoffCoords?.lat || 12.9698,
        dropoffLng: dropoffCoords?.lng || 77.7500,
        dropoffAddress: dropoff,
      };
      
      // Let's pass the request details up so App.tsx can send POST /ride/request and handle socket state transitions
      onStartBooking({
        ...payload,
        fareEstimate: estimate || 350,
        transmissionType: vehicle?.transmissionType || 'AUTOMATIC',
        vehicleMake: vehicle?.make || 'Honda',
        vehicleModel: vehicle?.model || 'Civic',
        plateNo: vehicle?.plateNo || 'KA-03-MD-5582'
      });
    } catch (err) {
      Alert.alert('Booking Error', 'Could not create booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Backdrop */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: pickupCoords.lat,
          longitude: pickupCoords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
        <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} title="Pickup" />
        {dropoffCoords && (
          <Marker coordinate={{ latitude: dropoffCoords.lat, longitude: dropoffCoords.lng }} title="Dropoff" />
        )}
      </MapView>

      {/* Header Overlay */}
      <SafeAreaView style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[styles.logoMark, { backgroundColor: theme.text }]} />
          <Text style={[typography.label, { color: theme.text, fontSize: 11, marginLeft: 8 }]}>
            DRIVESAFE RIDER
          </Text>
        </View>
      </SafeAreaView>

      {/* Main Bottom Control Center */}
      <View style={[styles.bottomCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Selected Vehicle Profile Card */}
          {vehicle && (
            <View style={[styles.vehicleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Car size={22} color={theme.primary} />
              <View style={styles.vehicleInfo}>
                <Text style={[typography.h2, { color: theme.text, fontSize: 13 }]}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10, marginTop: 2 }]}>
                  {vehicle.plateNo} • {vehicle.transmissionType || 'AUTOMATIC'} TRANSMISSION
                </Text>
              </View>
              <View style={[styles.certBadge, { backgroundColor: theme.text }]}>
                <Text style={[typography.label, { color: theme.background, fontSize: 8 }]}>ACTIVE</Text>
              </View>
            </View>
          )}

          {/* Route Presets */}
          <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginBottom: 8, marginTop: 16 }]}>
            QUICK PRESETS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => handleApplyPreset(preset)}
                style={[styles.presetBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[typography.label, { color: theme.text, fontSize: 11 }]}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pickup and Dropoff Fields */}
          <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginBottom: 8, marginTop: 16 }]}>
            ROUTE DETAILS
          </Text>
          <View style={[styles.locationBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
              <MapPin size={16} color="#34C759" />
              <TextInput
                placeholder="Pickup Location"
                placeholderTextColor={theme.textSecondary}
                value={pickup}
                onChangeText={setPickup}
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.inputRow}>
              <MapPin size={16} color={theme.text} />
              <TextInput
                placeholder="Where to drive home?"
                placeholderTextColor={theme.textSecondary}
                value={dropoff}
                onChangeText={(t) => {
                  setDropoff(t);
                  setDropoffCoords({ lat: 12.9698, lng: 77.7500 }); // Mock destination coordinates
                  setEstimate(null);
                }}
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>
          </View>

          {/* Actions */}
          {estimate !== null ? (
            <View style={styles.estimateActions}>
              <View style={[styles.fareDetails, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>ESTIMATED FARE</Text>
                <Text style={[typography.h1, { color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 4 }]}>
                  ₹{Math.round(estimate)}
                </Text>
              </View>
              <Button
                label={submitting ? 'CONFIRMING...' : 'BOOK DESIGNATED DRIVER'}
                onPress={handleBook}
                style={styles.bookBtn}
              />
            </View>
          ) : (
            <Button
              label={loadingEstimate ? 'CALCULATING FARE...' : 'GET FARE ESTIMATE'}
              onPress={handleGetEstimate}
              style={styles.estimateBtn}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFill },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  logoMark: { width: 8, height: 8, borderRadius: 4 },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 24,
    maxHeight: 520,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 16 },
    }),
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vehicleInfo: { flex: 1, marginLeft: 16 },
  certBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetsRow: { flexDirection: 'row', gap: 10, marginHorizontal: -4 },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  locationBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  estimateBtn: { marginTop: 20 },
  estimateActions: { marginTop: 16, gap: 12 },
  fareDetails: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  bookBtn: {},
});
