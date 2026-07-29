import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Modal } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Heading, Card } from '@platform/shared/src/components/Core';
import { ShieldAlert, Star, User, AlertTriangle } from 'lucide-react-native';

interface Props {
  ride: any;
  driver: {
    name: string;
    rating: number;
  };
  driverLocation: {
    lat: number;
    lng: number;
  } | null;
  status: string;
  onTriggerSos: () => void;
  isSosActive: boolean;
  onCloseSosModal: () => void;
}

export default function TrackingScreen({
  ride,
  driver,
  driverLocation,
  status,
  onTriggerSos,
  isSosActive,
  onCloseSosModal,
}: Props) {
  const { theme, typography, mode } = useTheme();
  const mapRef = useRef<MapView>(null);

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // Determine progress percent
  const getProgress = () => {
    switch (status) {
      case 'MATCHED': return 0.15;
      case 'ENROUTE': return 0.4;
      case 'ARRIVED': return 0.6;
      case 'IN_PROGRESS': return 0.8;
      case 'COMPLETED': return 1.0;
      default: return 0.05;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'MATCHED': return 'DRIVER MATCHED';
      case 'ENROUTE': return 'DRIVER ARRIVING';
      case 'ARRIVED': return 'DRIVER ARRIVED';
      case 'IN_PROGRESS': return 'TRIP ONGOING';
      case 'COMPLETED': return 'TRIP COMPLETED';
      default: return status;
    }
  };

  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 1000);
    }
  }, [driverLocation]);

  return (
    <View style={styles.container}>
      {/* Map backdrop */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: ride.pickupLat,
          longitude: ride.pickupLng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />

        {/* Pickup marker (A) */}
        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} title="Pickup (A)">
          <View style={[styles.markerBadge, { backgroundColor: '#34C759' }]}>
            <Text style={styles.markerText}>A</Text>
          </View>
        </Marker>

        {/* Dropoff marker (B) */}
        <Marker coordinate={{ latitude: ride.dropoffLat, longitude: ride.dropoffLng }} title="Dropoff (B)">
          <View style={[styles.markerBadge, { backgroundColor: theme.text }]}>
            <Text style={[styles.markerText, { color: theme.background }]}>B</Text>
          </View>
        </Marker>

        {/* Driver location taxi marker (🚕) */}
        {driverLocation && (
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Driver Location">
            <View style={styles.taxiMarker}>
              <Text style={styles.taxiEmoji}>🚕</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Control Overlay at Bottom */}
      <SafeAreaView style={styles.overlay}>
        <Card style={styles.card}>
          {/* Driver Profile Header */}
          <View style={styles.driverHeader}>
            <View style={styles.driverMeta}>
              <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                <User size={24} color={theme.textSecondary} />
              </View>
              <View style={styles.driverNameContainer}>
                <Heading style={{ fontSize: 20, fontWeight: '800' }}>{driver.name || 'Alexander'}</Heading>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={[typography.label, { color: theme.textSecondary, fontSize: 11, marginLeft: 4 }]}>
                    {driver.rating?.toFixed(1) || '4.9'} · Verified Driver
                  </Text>
                </View>
              </View>
            </View>

            {/* Current Trip Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
              <Text style={[typography.label, { color: theme.primary, fontSize: 8 }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>

          {/* Trip Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressBarFill, {
                backgroundColor: theme.primary,
                width: `${getProgress() * 100}%`
              }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10 }]}>Pickup</Text>
              <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10 }]}>Destination</Text>
            </View>
          </View>

          {/* Emergency SOS Button */}
          <TouchableOpacity
            onPress={onTriggerSos}
            style={[styles.sosBtn, { backgroundColor: '#FFF5F5' }]}
          >
            <ShieldAlert size={16} color="#FF3B30" />
            <Text style={[typography.label, { color: '#FF3B30', fontSize: 12, marginLeft: 8 }]}>
              🚨 Emergency SOS
            </Text>
          </TouchableOpacity>
        </Card>
      </SafeAreaView>

      {/* SOS Active Modal */}
      <Modal
        visible={isSosActive}
        transparent
        animationType="fade"
        onRequestClose={onCloseSosModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <AlertTriangle size={48} color="#FF3B30" />
            <Heading style={{ color: theme.text, fontSize: 22, marginTop: 16, textAlign: 'center' }}>
              SOS Signal Broadcasted
            </Heading>
            <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 13, lineHeight: 18 }]}>
              Your current live coordinates and vehicle details have been logged to our 24/7 Operations Center. 
              Our security dispatch team is monitoring your ride.
            </Text>
            <TouchableOpacity
              onPress={onCloseSosModal}
              style={[styles.modalCloseBtn, { backgroundColor: theme.text }]}
            >
              <Text style={[typography.label, { color: theme.background, fontSize: 12 }]}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFill },
  markerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
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
  taxiEmoji: {
    fontSize: 20,
  },
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
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverNameContainer: {
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sosBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  modalCloseBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
});
