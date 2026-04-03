import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  Platform, Animated, Vibration, Alert,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../../../packages/shared/src/theme/ThemeProvider';
import client from '../../../../../packages/shared/src/api/client';
import {
  MapPin, Car, Navigation, X, Check,
  Clock, DollarSign, AlertTriangle, User,
} from 'lucide-react-native';

interface Request {
  id: string;
  riderName: string;
  pickupAddress?: string;
  dropoffAddr?: string;
  carModel?: string;
  transmission?: string;
  category?: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  price?: number;
  distanceKm?: number;
  type?: string;
}

interface Props {
  request: Request;
  onAccept: () => void;
  onReject: () => void;
}

const COUNTDOWN_SECONDS = 30;

export default function IncomingRequestScreen({ request, onAccept, onReject }: Props) {
  const { theme, typography, mode } = useTheme();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [accepting, setAccepting] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const slideIn = useRef(new Animated.Value(300)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideIn, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Pulse animation for urgency
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Vibrate to alert driver
    Vibration.vibrate([0, 200, 100, 200]);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          onReject();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await client.post('/driver/accept', { rideId: request.id });
      onAccept();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept ride');
      setAccepting(false);
    }
  };

  const isHiring = request.type === 'HIRING';

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: request.pickupLat,
          longitude: request.pickupLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
        <Marker coordinate={{ latitude: request.pickupLat, longitude: request.pickupLng }}>
          <View style={[styles.pickupMarker, { backgroundColor: '#34C759' }]}>
            <MapPin size={16} color="#fff" fill="#fff" />
          </View>
        </Marker>
      </MapView>

      {/* Countdown bar */}
      <View style={[styles.countdownBar, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.countdownFill,
            {
              backgroundColor: countdown > 10 ? '#34C759' : '#FF3B30',
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Bottom Card */}
      <SafeAreaView style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              transform: [{ translateY: slideIn }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>
                NEW RIDE REQUEST
              </Text>
              <Text style={[typography.h1, { color: theme.text, fontSize: 22, marginTop: 4 }]}>
                {request.riderName}
              </Text>
            </View>
            <Animated.View
              style={[
                styles.timerCircle,
                {
                  borderColor: countdown > 10 ? '#34C759' : '#FF3B30',
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={[typography.h2, { color: countdown > 10 ? '#34C759' : '#FF3B30', fontSize: 18 }]}>
                {countdown}
              </Text>
            </Animated.View>
          </View>

          {/* Location Info */}
          <View style={[styles.locationBlock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.locationRow}>
              <View style={[styles.dotGreen]} />
              <Text style={[typography.body, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                {request.pickupAddress || `${request.pickupLat.toFixed(4)}, ${request.pickupLng.toFixed(4)}`}
              </Text>
            </View>
            <View style={[styles.locationDivider, { backgroundColor: theme.border }]} />
            <View style={styles.locationRow}>
              <View style={[styles.dotBlack, { backgroundColor: theme.text }]} />
              <Text style={[typography.body, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1}>
                {request.dropoffAddr || `${request.dropoffLat.toFixed(4)}, ${request.dropoffLng.toFixed(4)}`}
              </Text>
            </View>
          </View>

          {/* Trip Info Chips */}
          <View style={styles.chipsRow}>
            <View style={[styles.chip, { backgroundColor: theme.surface }]}>
              <Navigation size={12} color={theme.textSecondary} />
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginLeft: 4 }]}>
                {request.distanceKm || '—'} km
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: theme.surface }]}>
              <DollarSign size={12} color={theme.textSecondary} />
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginLeft: 4 }]}>
                ₹{Math.round(request.price || 0)}
              </Text>
            </View>
            {isHiring && (
              <View style={[styles.chip, { backgroundColor: '#FFF5F5', borderColor: '#FF3B30', borderWidth: 1 }]}>
                <Car size={12} color="#FF3B30" />
                <Text style={[typography.label, { color: '#FF3B30', fontSize: 10, marginLeft: 4 }]}>
                  DRIVE CLIENT'S CAR
                </Text>
              </View>
            )}
            {request.transmission && (
              <View style={[styles.chip, { backgroundColor: theme.surface }]}>
                <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>
                  {request.transmission}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onReject}
              style={[styles.rejectBtn, { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' }]}
            >
              <X size={22} color="#FF3B30" />
              <Text style={[typography.label, { color: '#FF3B30', marginLeft: 8, fontSize: 12 }]}>
                DECLINE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              disabled={accepting}
              style={[styles.acceptBtn, { backgroundColor: '#34C759' }]}
            >
              <Check size={22} color="#fff" />
              <Text style={[typography.label, { color: '#fff', marginLeft: 8, fontSize: 12 }]}>
                {accepting ? 'ACCEPTING...' : 'ACCEPT RIDE'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  countdownBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, zIndex: 100 },
  countdownFill: { height: '100%', borderRadius: 2 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  card: {
    margin: 12,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBlock: { borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginRight: 12 },
  dotBlack: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  locationDivider: { height: 1, marginHorizontal: 36 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  pickupMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
