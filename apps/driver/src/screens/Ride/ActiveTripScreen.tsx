import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { useLocationStreamer } from '@platform/shared/src/hooks/useLocationStreamer';
import client from '@platform/shared/src/api/client';
import { Navigation, MapPin, Phone, ShieldAlert, CheckCircle, Key } from 'lucide-react-native';
import polyline from '@mapbox/polyline';

type TripPhase = 'ARRIVING' | 'ONGOING' | 'COMPLETING';

interface Props {
  ride: any;
  driverId: string;
  onFinished: () => void;
}

export default function ActiveTripScreen({ ride, driverId, onFinished }: Props) {
  const { theme, typography, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [phase, setPhase] = useState<TripPhase>('ARRIVING');
  const [completing, setCompleting] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const { socket } = useLocationStreamer(driverId, true);

  const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);

  useEffect(() => {
    if (ride.routeGeometry) {
      const decoded = polyline.decode(ride.routeGeometry);
      setRouteCoords(decoded.map(c => ({ latitude: c[0], longitude: c[1] })));
    } else {
      setRouteCoords([
        { latitude: ride.pickupLat || 12.9716, longitude: ride.pickupLng || 77.5946 },
        { latitude: ride.dropoffLat || 12.9141, longitude: ride.dropoffLng || 77.6413 },
      ]);
    }
  }, [ride.routeGeometry]);

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const phaseConfig: Record<TripPhase, { label: string; color: string; next: string }> = {
    ARRIVING: {
      label: 'ARRIVED AT PICKUP',
      color: '#007AFF',
      next: 'Mark as Arrived',
    },
    ONGOING: {
      label: 'COMPLETE TRIP',
      color: '#34C759',
      next: 'Complete Trip',
    },
    COMPLETING: {
      label: 'COMPLETING...',
      color: theme.border,
      next: 'Completing...',
    },
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return;
    setVerifyingOtp(true);
    try {
      await client.post('/driver/verify-otp', { rideId: ride.id, otp });
      setOtpVerified(true);
      if (Platform.OS !== 'web') {
        Alert.alert(
          'OTP Verified!',
          'The rider code is correct. You can now start the trip.',
          [
            { text: 'START TRIP NOW', onPress: () => handlePhaseAction() },
            { text: 'OK' }
          ]
        );
      } else {
        handlePhaseAction();
      }
    } catch (err: any) {
      Alert.alert('Invalid OTP', err.response?.data?.message || 'The code entered is incorrect.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSos = async () => {
    try {
      await client.post('/rides/sos', {
        rideId: ride.id,
        lat: ride.pickupLat,
        lng: ride.pickupLng,
        message: 'DRIVER TRIGGERED EMERGENCY SOS'
      });
      if (Platform.OS !== 'web') Alert.alert('🚨 SOS SENT', 'Emergency dispatch has been notified.');
    } catch {
      Alert.alert('Error', 'Failed to send SOS signal.');
    }
  };

  const handlePhaseAction = async () => {
    if (phase === 'ARRIVING') {
      if (!otpVerified) {
        Alert.alert('OTP Required', 'Please enter and verify the 4-digit code from the rider first.');
        return;
      }
      // Driver arrived at pickup — start trip
      try {
        await client.post('/driver/complete', { rideId: ride.id });
        setPhase('ONGOING');
      } catch {
        Alert.alert('Error', 'Could not update ride status');
      }
    } else if (phase === 'ONGOING') {
      setCompleting(true);
      setPhase('COMPLETING');
      try {
        await client.post('/driver/finish', { rideId: ride.id });
        onFinished();
      } catch {
        Alert.alert('Error', 'Could not complete ride');
        setPhase('ONGOING');
        setCompleting(false);
      }
    }
  };

  const config = phaseConfig[phase];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: (ride.pickupLat + ride.dropoffLat) / 2 || 12.945,
          longitude: (ride.pickupLng + ride.dropoffLng) / 2 || 77.618,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />

        {/* Route Line */}
        <Polyline
          coordinates={routeCoords}
          strokeColor={theme.text}
          strokeWidth={3}
          lineDashPattern={phase === 'ARRIVING' ? [6, 3] : []}
        />

        {/* Pickup */}
        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }}>
          <View style={[styles.markerGreen]}>
            <MapPin size={16} color="#fff" fill="#fff" />
          </View>
        </Marker>

        {/* Dropoff */}
        <Marker coordinate={{ latitude: ride.dropoffLat, longitude: ride.dropoffLng }}>
          <View style={[styles.markerBlack, { backgroundColor: theme.text }]}>
            <MapPin size={16} color={theme.background} fill={theme.background} />
          </View>
        </Marker>
      </MapView>

      {/* Status Header */}
      <SafeAreaView style={styles.topBar}>
        <View style={[styles.phaseBadge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
          <View style={[styles.phaseDot, { backgroundColor: config.color }]} />
          <Text style={[typography.label, { color: config.color, fontSize: 10 }]}>
            {phase === 'ARRIVING' ? 'EN ROUTE TO PICKUP' : 'TRIP IN PROGRESS'}
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom Panel */}
      <SafeAreaView style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          {/* Rider Info */}
          <View style={styles.riderRow}>
            <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
              <Text style={[typography.h2, { color: theme.text }]}>
                {ride.riderName?.[0] || 'R'}
              </Text>
            </View>
            <View style={styles.riderInfo}>
              <Text style={[typography.h2, { color: theme.text, fontSize: 18 }]}>
                {ride.riderName || 'Rider'}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary, fontSize: 12 }]}>
                {phase === 'ARRIVING' ? 'Waiting for you at pickup' : 'Trip ongoing · Drive safe'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: theme.surface }]}>
              <Phone size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* SOS */}
          <TouchableOpacity
            onPress={handleSos}
            style={styles.sosBtn}
          >
            <ShieldAlert size={14} color="#FF3B30" />
            <Text style={[typography.label, { color: '#FF3B30', fontSize: 10, marginLeft: 6 }]}>
              EMERGENCY SOS
            </Text>
          </TouchableOpacity>

          {/* OTP Verification Section (Only shown in ARRIVING phase) */}
          {phase === 'ARRIVING' && !otpVerified && (
            <View style={[styles.otpSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <View style={styles.otpHeader}>
                  <Key size={14} color={theme.textSecondary} />
                  <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginLeft: 8 }]}>RIDER VERIFICATION CODE</Text>
               </View>
               <View style={styles.otpInputRow}>
                  <TextInput
                    style={[styles.otpInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="ENTER 4-DIGIT CODE"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <TouchableOpacity 
                    onPress={handleVerifyOtp}
                    disabled={otp.length !== 4 || verifyingOtp}
                    style={[styles.verifyBtn, { backgroundColor: theme.text, opacity: otp.length === 4 ? 1 : 0.5 }]}
                  >
                    {verifyingOtp ? <ActivityIndicator size="small" color={theme.background} /> : <Text style={[typography.label, { color: theme.background, fontSize: 10 }]}>VERIFY</Text>}
                  </TouchableOpacity>
               </View>
            </View>
          )}

          {otpVerified && phase === 'ARRIVING' && (
            <View style={styles.verifiedBadge}>
               <CheckCircle size={14} color="#34C759" />
               <Text style={[typography.label, { color: '#34C759', fontSize: 10, marginLeft: 8 }]}>RIDER VERIFIED</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={handlePhaseAction}
            disabled={completing}
            style={[styles.ctaBtn, { backgroundColor: config.color }]}
          >
            <CheckCircle size={20} color="#fff" />
            <Text style={[typography.label, { color: '#fff', marginLeft: 10 }]}>
              {config.next}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  phaseDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  card: {
    margin: 14,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  riderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  riderInfo: { flex: 1 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    marginBottom: 14,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
  },
  markerGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBlack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  otpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  otpInputRow: { flexDirection: 'row', gap: 10 },
  otpInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
  verifyBtn: {
    width: 80,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F2FFF5',
    borderRadius: 12,
  }
});
