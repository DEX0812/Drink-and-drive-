import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { useLocationStreamer } from '../../../../packages/shared/src/hooks/useLocationStreamer';
import { Button, Heading, SubHeading, Card, Spacer } from '../../../../packages/shared/src/components/Core';
import { Navigation, ShieldAlert, Phone, CheckCircle, MessageCircle, MapPin, User, ChevronUp } from 'lucide-react-native';

interface ActiveTripProps {
  ride: any; // Mocked ride with riderName, pickup, destination
  driverId: string;
  onFinished: () => void;
}

export default function ActiveTripScreen({ ride, driverId, onFinished }: ActiveTripProps) {
  const { theme, typography, mode } = useTheme();
  const [status, setStatus] = useState<'PICKUP' | 'EN_ROUTE' | 'DROPOFF'>('PICKUP');
  
  // Start GPS Streaming as soon as the trip is active
  useLocationStreamer(driverId, true);

  const tileUrl = mode === 'light' 
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: ride.pickupLat || 12.9716,
          longitude: ride.pickupLng || 77.5946,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />

        <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }}>
          <View style={[styles.markerBase, { backgroundColor: theme.text }]}>
             <View style={styles.markerInner} />
          </View>
        </Marker>

        <Polyline
          coordinates={[
            { latitude: ride.pickupLat, longitude: ride.pickupLng },
            { latitude: ride.dropoffLat, longitude: ride.dropoffLng },
          ]}
          strokeColor={theme.text}
          strokeWidth={4}
        />
      </MapView>

      <SafeAreaView style={styles.overlay}>
         <Card style={styles.tripCard}>
            <View style={styles.dragHandle}>
               <View style={[styles.handleLine, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.statusHeader}>
               <View style={[styles.statusBadge, { backgroundColor: theme.surface }]}>
                  <Text style={[typography.label, { color: theme.text, fontSize: 10 }]}>{status}</Text>
               </View>
               <View style={styles.timeInfo}>
                  <Text style={[typography.h2, { fontSize: 24 }]}>12 min</Text>
                  <Text style={[typography.body, { color: theme.textSecondary, fontSize: 12 }]}>To destination</Text>
               </View>
               <TouchableOpacity style={[styles.sosBtn, { borderColor: theme.error }]}>
                  <ShieldAlert size={20} color="#FF3B30" />
               </TouchableOpacity>
            </View>

            <Spacer size={24} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Spacer size={24} />

            <View style={styles.riderRow}>
               <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                  <User size={28} color={theme.textSecondary} />
               </View>
               <View style={styles.riderInfo}>
                  <Heading style={{ fontSize: 22 }}>{ride.riderName || 'Siddharth'}</Heading>
                  <View style={styles.locationSmall}>
                     <MapPin size={12} color={theme.textSecondary} />
                     <Text style={[typography.body, { color: theme.textSecondary, marginLeft: 4, fontSize: 13 }]} numberOfLines={1}>
                        {ride.destinationAddress || 'Whitefield, Bangalore'}
                     </Text>
                  </View>
               </View>
               <View style={styles.riderActions}>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: theme.surface }]}>
                     <MessageCircle size={20} color={theme.text} />
                  </TouchableOpacity>
                  <Spacer size={12} horizontal />
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: theme.surface }]}>
                     <Phone size={20} color={theme.text} />
                  </TouchableOpacity>
               </View>
            </View>

            <Spacer size={30} />

            <Button 
               label={status === 'PICKUP' ? 'RIDER PICKED UP' : (status === 'EN_ROUTE' ? 'ARRIVED AT DESTINATION' : 'COMPLETE TRIP')} 
               onPress={() => {
                  if (status === 'PICKUP') setStatus('EN_ROUTE');
                  else if (status === 'EN_ROUTE') setStatus('DROPOFF');
                  else onFinished();
               }} 
               style={styles.mainBtn}
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
  tripCard: { borderRadius: 32, padding: 24 },
  dragHandle: { alignItems: 'center', marginBottom: 16 },
  handleLine: { width: 40, height: 4, borderRadius: 2 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timeInfo: { alignItems: 'center' },
  sosBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, width: '100%' },
  riderRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  riderInfo: { flex: 1 },
  locationSmall: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  riderActions: { flexDirection: 'row' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  mainBtn: { height: 60 },
  markerBase: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  markerInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }
});
