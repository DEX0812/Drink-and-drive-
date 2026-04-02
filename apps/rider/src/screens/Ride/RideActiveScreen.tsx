import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { useRideTracking } from '../../../../packages/shared/src/hooks/useRideTracking';
import { Button, Heading, SubHeading, Card, Spacer } from '../../../../packages/shared/src/components/Core';
import { Phone, ShieldAlert, MessageCircle, Navigation, Star, MapPin, User } from 'lucide-react-native';

interface RideActiveProps {
  ride: any; 
  onFinished: () => void;
}

export default function RideActiveScreen({ ride, onFinished }: RideActiveProps) {
  const { theme, typography, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const { driverLocation, connected } = useRideTracking(ride.id, ride.driverId);

  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: ride.pickupLat, longitude: ride.pickupLng },
          { latitude: driverLocation.lat, longitude: driverLocation.lng }
        ],
        { edgePadding: { top: 100, right: 100, bottom: 400, left: 100 }, animated: true }
      );
    }
  }, [driverLocation]);

  const tileUrl = mode === 'light' 
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: ride.pickupLat,
          longitude: ride.pickupLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />

        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }}>
          <View style={[styles.markerBase, { backgroundColor: theme.text }]}>
             <View style={styles.markerInner} />
          </View>
        </Marker>

        {driverLocation && (
          <Marker 
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            rotation={driverLocation.heading || 0}
          >
            <View style={[styles.carMarker, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Navigation size={18} color={mode === 'light' ? '#fff' : '#000'} fill={mode === 'light' ? '#fff' : '#000'} />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.overlay}>
         <Card style={styles.activeCard}>
            <View style={styles.statusHeader}>
               <View style={styles.statusBadge}>
                  <View style={[styles.liveIndicator, { backgroundColor: connected ? '#34C759' : '#FF3B30' }]} />
                  <Text style={[typography.label, { color: theme.text, fontSize: 10 }]}>
                    {connected ? 'LIVE TRACKING' : 'OFFLINE'}
                  </Text>
               </View>
               <TouchableOpacity style={styles.safetyBtn}>
                  <ShieldAlert size={16} color="#FF3B30" />
                  <Text style={[typography.label, { color: '#FF3B30', fontSize: 10, marginLeft: 4 }]}>Safety</Text>
               </TouchableOpacity>
            </View>

            <Spacer size={20} />

            <View style={styles.driverProfile}>
               <View style={styles.driverMain}>
                  <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                     <User size={30} color={theme.textSecondary} />
                  </View>
                  <View style={styles.driverText}>
                     <Heading style={{ fontSize: 24, letterSpacing: -0.5 }}>{ride.driverName || 'Alexander'}</Heading>
                     <Text style={[typography.body, { color: theme.textSecondary }]}>
                       {ride.carModel || 'Toyota Camry'} • <Text style={{ color: theme.text, fontWeight: '700' }}>{ride.licensePlate || 'K-9281'}</Text>
                     </Text>
                  </View>
               </View>
               <View style={[styles.ratingPill, { backgroundColor: theme.surface }]}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Text style={[typography.label, { color: theme.text, fontSize: 12, marginLeft: 4 }]}>4.9</Text>
               </View>
            </View>

            <Spacer size={24} />

            <View style={styles.actionGrid}>
               <TouchableOpacity style={[styles.gridBtn, { backgroundColor: theme.surface }]}>
                  <MessageCircle size={22} color={theme.text} />
                  <Text style={[typography.label, { color: theme.text, fontSize: 10, marginTop: 8 }]}>Message</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.gridBtn, { backgroundColor: theme.surface }]}>
                  <Phone size={22} color={theme.text} />
                  <Text style={[typography.label, { color: theme.text, fontSize: 10, marginTop: 8 }]}>Call</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.gridBtn, { backgroundColor: theme.surface }]}>
                  <MapPin size={22} color={theme.text} />
                  <Text style={[typography.label, { color: theme.text, fontSize: 10, marginTop: 8 }]}>Details</Text>
               </TouchableOpacity>
            </View>

            <Spacer size={24} />

            <Button 
               label="CANCEL TRIP" 
               variant="outline"
               onPress={onFinished} 
               style={{ borderColor: theme.error }}
            />
         </Card>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: { position: 'absolute', bottom: 20, left: 10, right: 10 },
  activeCard: { borderRadius: 24, padding: 24 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  safetyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  driverProfile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverMain: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  driverText: { justifyContent: 'center' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridBtn: { width: '31%', height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  markerBase: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  markerInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  carMarker: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }
});
