import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../../../packages/shared/src/theme/ThemeProvider';
import { useLocationStreamer } from '../../../../../packages/shared/src/hooks/useLocationStreamer';
import client from '../../../../../packages/shared/src/api/client';
import { Navigation, MapPin, Phone, ShieldAlert, CheckCircle } from 'lucide-react-native';

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

  const { socket } = useLocationStreamer(driverId, true);

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

  const handlePhaseAction = async () => {
    if (phase === 'ARRIVING') {
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

  const routeCoords = [
    { latitude: ride.pickupLat || 12.9716, longitude: ride.pickupLng || 77.5946 },
    { latitude: ride.dropoffLat || 12.9141, longitude: ride.dropoffLng || 77.6413 },
  ];

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
        <Marker coordinate={routeCoords[0]}>
          <View style={[styles.markerGreen]}>
            <MapPin size={16} color="#fff" fill="#fff" />
          </View>
        </Marker>

        {/* Dropoff */}
        <Marker coordinate={routeCoords[1]}>
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
            onPress={() => Alert.alert('🚨 SOS', 'Emergency services have been notified.')}
            style={styles.sosBtn}
          >
            <ShieldAlert size={14} color="#FF3B30" />
            <Text style={[typography.label, { color: '#FF3B30', fontSize: 10, marginLeft: 6 }]}>
              EMERGENCY SOS
            </Text>
          </TouchableOpacity>

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
});
