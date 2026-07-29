import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Alert, ActivityIndicator
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { useLocationStreamer } from '@platform/shared/src/hooks/useLocationStreamer';
import { Heading, Card } from '@platform/shared/src/components/Core';
import { Navigation, MapPin, CheckCircle, Smartphone } from 'lucide-react-native';
import client from '@platform/shared/src/api/client';

interface Props {
  ride: any;
  driverId: string;
  onFinished: () => void;
}

export default function ActiveTripScreen({ ride, driverId, onFinished }: Props) {
  const { theme, typography, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  // Trip statuses: MATCHED, ENROUTE, ARRIVED, IN_PROGRESS, COMPLETED
  const [status, setStatus] = useState<string>(ride.status || 'MATCHED');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: ride.pickupLat || 12.9716,
    lng: ride.pickupLng || 77.5946,
  });
  const [updating, setUpdating] = useState(false);

  // Grab active socket stream connection
  const { socket } = useLocationStreamer(driverId, true);

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // 1. Join ride room on mount
  useEffect(() => {
    if (socket && ride.id) {
      socket.emit('join_ride', { rideId: ride.id });
      console.log(`[SOCKET] Driver joined ride room: ${ride.id}`);
    }
  }, [socket, ride.id]);

  // 2. Simulated movement controller (every 3 seconds)
  useEffect(() => {
    if (!socket || !ride.id) return;
    if (status !== 'ENROUTE' && status !== 'IN_PROGRESS') return;

    let targetLat = ride.pickupLat;
    let targetLng = ride.pickupLng;

    if (status === 'IN_PROGRESS') {
      targetLat = ride.dropoffLat;
      targetLng = ride.dropoffLng;
    }

    const startLat = currentCoords.lat;
    const startLng = currentCoords.lng;
    
    let step = 0;
    const totalSteps = 6;

    const interval = setInterval(() => {
      step++;
      const nextLat = startLat + ((targetLat - startLat) * step) / totalSteps;
      const nextLng = startLng + ((targetLng - startLng) * step) / totalSteps;
      
      setCurrentCoords({ lat: nextLat, lng: nextLng });

      // Specification: Emit WebSocket event "ping_location" with { rideId, lat, lng }
      socket.emit('ping_location', { rideId: ride.id, lat: nextLat, lng: nextLng });
      // Emit "updateLocation" also for older admin dashboard sync compatibility
      socket.emit('updateLocation', { driverId, lat: nextLat, lng: nextLng });

      console.log(`[SIMULATOR] Driver position pinged: ${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`);

      if (step >= totalSteps) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, socket, ride.id]);

  // 3. Status Action Handler
  const handleStatusTransition = async () => {
    let nextStatus = '';
    
    if (status === 'MATCHED') nextStatus = 'ENROUTE';
    else if (status === 'ENROUTE') nextStatus = 'ARRIVED';
    else if (status === 'ARRIVED') nextStatus = 'IN_PROGRESS';
    else if (status === 'IN_PROGRESS') nextStatus = 'COMPLETED';

    if (!nextStatus) return;

    setUpdating(true);
    try {
      // POST /ride/:rideId/status
      await client.post(`/ride/${ride.id}/status`, { status: nextStatus });
      setStatus(nextStatus);

      if (nextStatus === 'COMPLETED') {
        onFinished();
      }
    } catch (e) {
      console.warn('Status update endpoint failed, applying local state override', e);
      // Fallback/Mock override
      setStatus(nextStatus);
      if (nextStatus === 'COMPLETED') {
        onFinished();
      }
    } finally {
      setUpdating(false);
    }
  };

  const getActionButtonLabel = () => {
    switch (status) {
      case 'MATCHED': return 'Navigate to Rider';
      case 'ENROUTE': return 'I Have Arrived';
      case 'ARRIVED': return 'Start Trip';
      case 'IN_PROGRESS': return 'Arrived at Destination';
      default: return 'Continue';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'MATCHED': return 'Matched with Rider';
      case 'ENROUTE': return 'En Route to Pickup';
      case 'ARRIVED': return 'Arrived at Pickup Location';
      case 'IN_PROGRESS': return 'Driving to Destination';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  // Center map on driver coordinates
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [currentCoords]);

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />

        {/* Pickup marker */}
        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} title="Pickup">
          <View style={styles.markerPickup}>
            <MapPin size={16} color="#fff" fill="#fff" />
          </View>
        </Marker>

        {/* Dropoff marker */}
        <Marker coordinate={{ latitude: ride.dropoffLat, longitude: ride.dropoffLng }} title="Dropoff">
          <View style={[styles.markerDropoff, { backgroundColor: theme.text }]}>
            <MapPin size={16} color={theme.background} fill={theme.background} />
          </View>
        </Marker>

        {/* Driver custom car icon (🚕) */}
        <Marker coordinate={{ latitude: currentCoords.lat, longitude: currentCoords.lng }} title="You (Driver)">
          <View style={styles.taxiMarker}>
            <Text style={styles.taxiEmoji}>🚕</Text>
          </View>
        </Marker>
      </MapView>

      {/* active ride header overlay */}
      <SafeAreaView style={styles.headerArea}>
        <View style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9 }]}>MISSION STATUS</Text>
          <Text style={[typography.h2, { color: theme.text, fontSize: 13, marginTop: 2 }]}>{getStatusText()}</Text>
        </View>
      </SafeAreaView>

      {/* Control Panel Overlay at bottom */}
      <SafeAreaView style={styles.overlay}>
        <Card style={styles.card}>
          <Heading style={{ fontSize: 18, fontWeight: '800' }}>Active Ride Details</Heading>
          
          {/* Rider & Car descriptions */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>RIDER</Text>
            <Text style={[typography.h2, { color: theme.text, fontSize: 16, marginTop: 2 }]}>
              {ride.riderName || 'Rider'}
            </Text>

            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginTop: 12 }]}>VEHICLE DESCRIPTION</Text>
            <Text style={[typography.body, { color: theme.text, marginTop: 2 }]}>
              {ride.vehicleMake || ride.carModel || 'Honda'} {ride.vehicleModel || ''} ({ride.plateNo || ride.licensePlate || 'KA-03-MD-5582'})
            </Text>
            <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginTop: 2 }]}>
              Transmission: {ride.transmissionType || 'AUTOMATIC'}
            </Text>
          </View>

          {/* Current GPS coordinates */}
          <View style={styles.gpsRow}>
            <Smartphone size={14} color={theme.textSecondary} />
            <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginLeft: 8 }]}>
              GPS Coordinates: {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
            </Text>
          </View>

          {/* CTA Action button */}
          <TouchableOpacity
            onPress={handleStatusTransition}
            disabled={updating}
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          >
            {updating ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <>
                <CheckCircle size={18} color={theme.background} />
                <Text style={[typography.label, { color: theme.background, marginLeft: 10, fontSize: 13 }]}>
                  {getActionButtonLabel().toUpperCase()}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Card>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFill },
  headerArea: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  markerPickup: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerDropoff: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  taxiMarker: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxiEmoji: { fontSize: 20 },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  card: {
    borderRadius: 24,
    padding: 24,
  },
  detailsBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  actionBtn: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
