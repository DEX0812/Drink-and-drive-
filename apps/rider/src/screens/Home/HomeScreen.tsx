import React, { useRef, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Search } from 'lucide-react-native';
import BookingBottomSheet from './components/BookingBottomSheet';

export default function HomeScreen() {
  const { theme, mode, typography } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState({
    latitude: 12.9716, // Bangalore
    longitude: 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const tileUrl = mode === 'light' 
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

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
        <UrlTile 
          urlTemplate={tileUrl}
          maximumZ={19}
          flipY={false}
        />
      </MapView>

      {/* 🔍 PREMIUM SEARCH OVERLAY */}
      <SafeAreaView style={styles.searchOverlay}>
        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.searchBar, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          <View style={[styles.searchDot, { backgroundColor: theme.text }]} />
          <Text style={[typography.body, { color: theme.textSecondary, flex: 1, fontSize: 18, fontWeight: '600' }]}>
            Where to?
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.nowBtn}>
             <Text style={[typography.label, { color: theme.text, fontSize: 10 }]}>Now</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
      
      <BookingBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  searchOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 12 }
    })
  },
  searchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 16,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  nowBtn: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  }
});
