import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Navigation } from 'lucide-react-native';
import BookingBottomSheet from './components/BookingBottomSheet';
import io from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

interface NearbyDriver {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
}

interface Props {
  onBook: (ride: any) => void;
}

export default function HomeScreen({ onBook }: Props) {
  const { theme, typography, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [region] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // Listen for nearby driver location updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('locationUpdated', (data: NearbyDriver) => {
      setNearbyDrivers((prev) => {
        const existing = prev.findIndex((d) => d.driverId === data.driverId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />

        {/* Nearby Drivers */}
        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.driverId}
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            rotation={driver.heading || 0}
          >
            <View style={[styles.driverMarker, { backgroundColor: theme.text }]}>
              <Navigation size={14} color={theme.background} fill={theme.background} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Premium Header Badge */}
      <SafeAreaView style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[styles.logoMark, { backgroundColor: theme.text }]} />
          <Text style={[typography.label, { color: theme.text, fontSize: 11, marginLeft: 8 }]}>
            DRIVESAFE
          </Text>
        </View>
      </SafeAreaView>

      <BookingBottomSheet onBook={onBook} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
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
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
