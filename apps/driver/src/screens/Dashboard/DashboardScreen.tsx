import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, SafeAreaView, Text, TouchableOpacity,
  Platform, Animated, ScrollView, Vibration,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import client from '@platform/shared/src/api/client';
import { Navigation, Star, Clock, TrendingUp, Shield, Power, Activity, Car, FileText } from 'lucide-react-native';

const Spacer = ({ size }: { size: number }) => <View style={{ height: size }} />;

interface Stats {
  todayRides: number;
  todayEarnings: number;
  rating: number;
  isOnline: boolean;
}

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function DashboardScreen({ onNavigate }: Props) {
  const { theme, typography, mode } = useTheme();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<Stats>({
    todayRides: 0,
    todayEarnings: 0,
    rating: 0,
    isOnline: false,
  });
  const [toggling, setToggling] = useState(false);

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await client.get('/driver/profile');
      setIsOnline(data.isOnline);
      setStats({
        todayRides: data.stats?.todayRides || 0,
        todayEarnings: data.stats?.todayEarnings || 0,
        rating: data.rating || 4.9, 
        isOnline: data.isOnline,
      });
    } catch {
      // Defaults
    }
  };

  const handleToggleOnline = async () => {
    setToggling(true);
    if (Platform.OS !== 'web') Vibration.vibrate(20);
    
    const newStatus = !isOnline;
    try {
      await client.post('/driver/status', { isOnline: newStatus });
      setIsOnline(newStatus);
    } catch {
      // Error handling
    } finally {
      setToggling(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.header}>
            <View>
                <Text style={[typography.h2, { color: theme.textSecondary, fontSize: 10, letterSpacing: 2, fontWeight: '900' }]}>FLEET OPS V1</Text>
                <Text style={[typography.h1, { color: theme.text, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 4 }]}>
                    {user?.name?.split(' ')[0] || 'COMMANDER'}
                </Text>
            </View>
            <View style={[styles.rankBox, { backgroundColor: theme.surface }]}>
                 <Star size={12} color="#FBBF24" fill="#FBBF24" />
                 <Text style={[typography.label, { color: theme.text, fontSize: 12, marginLeft: 6, fontWeight: '800' }]}>{stats.rating.toFixed(1)}</Text>
            </View>
        </View>

        {/* Global Online/Offline Controller */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleToggleOnline}
          disabled={toggling}
          style={[
            styles.heroToggle,
            {
              backgroundColor: isOnline ? '#10B981' : theme.surface,
              borderColor: isOnline ? '#10B981' : theme.border,
            },
          ]}
        >
           <View style={[styles.glowCircle, { backgroundColor: isOnline ? 'rgba(255,255,255,0.2)' : theme.background }]}>
              <Power size={28} color={isOnline ? '#fff' : theme.textSecondary} strokeWidth={2.5} />
           </View>
           <View style={styles.toggleTextContainer}>
              <Text style={[typography.h2, { color: isOnline ? '#fff' : theme.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }]}>
                {isOnline ? 'LIVE & ACTIVE' : 'SYSTEM OFFLINE'}
              </Text>
              <Text style={[typography.body, { color: isOnline ? 'rgba(255,255,255,0.7)' : theme.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 2 }]}>
                {isOnline ? 'Searching for near matching riders' : 'Tap to synchronize with network'}
              </Text>
           </View>
           {isOnline && <Activity size={18} color="#fff" style={styles.pulseIcon} />}
        </TouchableOpacity>

        {/* Intelligence Block */}
        <View style={styles.statsGrid}>
           <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <TrendingUp size={20} color="#10B981" />
               <View style={{ marginTop: 16 }}>
                   <Text style={[typography.h1, { color: theme.text, fontSize: 24, fontWeight: '900' }]}>₹{stats.todayEarnings.toLocaleString()}</Text>
                   <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9, letterSpacing: 1.5, marginTop: 4 }]}>EARNINGS TODAY</Text>
               </View>
           </View>
           <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <Clock size={20} color="#3B82F6" />
               <View style={{ marginTop: 16 }}>
                   <Text style={[typography.h1, { color: theme.text, fontSize: 24, fontWeight: '900' }]}>{stats.todayRides}</Text>
                   <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9, letterSpacing: 1.5, marginTop: 4 }]}>COMPLETED MISSIONS</Text>
               </View>
           </View>
        </View>

        {/* Operational Range Map */}
        <View style={[styles.mapWrapper, { borderColor: theme.border }]}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: 12.9716,
                longitude: 77.5946,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
            </MapView>
            <View style={styles.mapOverlay}>
                <View style={[styles.glassBadge, { backgroundColor: theme.background + '90' }]}>
                    <Navigation size={12} color={theme.text} strokeWidth={2.5} />
                    <Text style={[typography.label, { color: theme.text, fontSize: 10, fontWeight: '900', marginLeft: 8 }]}>OPTIMIZED SECTOR 04</Text>
                </View>
            </View>
        </View>

        <View style={[styles.safetyCard, { backgroundColor: theme.surface, borderLeftColor: '#3B82F6' }]}>
            <Shield size={20} color="#3B82F6" />
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[typography.h2, { color: theme.text, fontSize: 14, fontWeight: '800' }]}>Driver Protection Active</Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginTop: 2 }]}>Your insurance coverage is currently active and protecting your journey.</Text>
            </View>
        </View>

        <Spacer size={24} />

        <TouchableOpacity 
          onPress={() => onNavigate?.('Documents')}
          style={[styles.actionCard, { backgroundColor: theme.surface, borderLeftColor: '#FBBF24' }]}
        >
            <FileText size={20} color="#FBBF24" />
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[typography.h2, { color: theme.text, fontSize: 14, fontWeight: '800' }]}>Verification Documents</Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginTop: 2 }]}>Upload and manage your license, insurance and IDs.</Text>
            </View>
        </TouchableOpacity>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 28 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 32,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  rankBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 16,
  },
  heroToggle: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 16 },
        android: { elevation: 8 },
    }),
  },
  glowCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  toggleTextContainer: { flex: 1, marginLeft: 20 },
  pulseIcon: { marginLeft: 10 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statItem: { flex: 1, padding: 20, borderRadius: 28, borderWidth: 1 },
  mapWrapper: { height: 200, borderRadius: 32, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
  map: { flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: 'flex-end' },
  glassBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  safetyCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderLeftWidth: 4, marginBottom: 12 },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderLeftWidth: 4 },
});
