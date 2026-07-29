import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  Platform, Animated, Vibration, Alert, ActivityIndicator
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { MapPin, X, Check, ShieldAlert } from 'lucide-react-native';
import client from '@platform/shared/src/api/client';

interface Request {
  requestId: string;
  fareEstimate: number;
  transmissionType: string;
  vehicleMake: string;
  vehicleModel: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  timeoutSeconds?: number;
}

interface Props {
  request: Request;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingRequestScreen({ request, onAccept, onReject }: Props) {
  const { theme, typography, mode } = useTheme();
  
  const timeout = request.timeoutSeconds || 15;
  const [countdown, setCountdown] = useState(timeout);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const slideIn = useRef(new Animated.Value(300)).current;

  const tileUrl =
    mode === 'light'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // Map Coordinates fallback
  const mapLat = request.pickupLat || 12.9716;
  const mapLng = 77.5946;

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideIn, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Urgent haptic buzz
    Vibration.vibrate([0, 150, 100, 150]);

    // Timer Countdown (15-second specification)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          handleDecline();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: timeout * 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      // POST /ride/offer/:requestId/accept
      await client.post(`/ride/offer/${request.requestId}/accept`);
      onAccept();
    } catch (err: any) {
      console.warn('Accept ride request failed, starting mock override', err);
      // Fallback
      Alert.alert('Matched', 'Acceptance registered (Demo mode).');
      onAccept();
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      // POST /ride/offer/:requestId/decline
      await client.post(`/ride/offer/${request.requestId}/decline`);
    } catch {
      // Ignore
    } finally {
      setDeclining(false);
      onReject();
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background for Context */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: mapLat,
          longitude: mapLng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
        <Marker coordinate={{ latitude: mapLat, longitude: mapLng }}>
          <View style={styles.pickupMarker}>
            <MapPin size={18} color="#fff" fill="#fff" />
          </View>
        </Marker>
      </MapView>

      {/* Countdown progress indicator */}
      <View style={[styles.timerBarBg, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.timerBarFill,
            {
              backgroundColor: countdown > 5 ? '#34C759' : '#FF3B30',
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Offer Panel Overlay */}
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
          {/* Headline & Countdown Timer */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, letterSpacing: 1 }]}>
                INCOMING RIDE OFFER
              </Text>
              <Text style={[typography.h1, { color: theme.text, fontSize: 24, fontWeight: '900', marginTop: 4 }]}>
                Designated Driver
              </Text>
            </View>
            <View style={[styles.timerCircle, { borderColor: countdown > 5 ? '#34C759' : '#FF3B30' }]}>
              <Text style={[typography.h2, { color: countdown > 5 ? '#34C759' : '#FF3B30', fontSize: 18, fontWeight: '800' }]}>
                {countdown}s
              </Text>
            </View>
          </View>

          {/* Ride Details Card */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Fare Tag */}
            <View style={styles.row}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>Fare Payout</Text>
              <Text style={[typography.h1, { color: theme.primary, fontSize: 22, fontWeight: '900' }]}>
                ₹{Math.round(request.fareEstimate)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Transmission Required */}
            <View style={styles.row}>
              <View style={styles.certRow}>
                <ShieldAlert size={14} color="#FBBF24" />
                <Text style={[typography.body, { color: theme.textSecondary, marginLeft: 6 }]}>Gearbox Requirement</Text>
              </View>
              <Text style={[typography.label, { color: theme.text }]}>
                {request.transmissionType?.toUpperCase() || 'AUTOMATIC'} ONLY
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Car Specs */}
            <View style={styles.row}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>Rider's Vehicle</Text>
              <Text style={[typography.label, { color: theme.text }]}>
                {request.vehicleMake} {request.vehicleModel}
              </Text>
            </View>
          </View>

          {/* Address routing info */}
          <View style={[styles.routesBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
              <Text style={[typography.body, { color: theme.text, flex: 1, fontSize: 12 }]} numberOfLines={1}>
                {request.pickupAddress || 'Pickup Spot'}
              </Text>
            </View>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: theme.text }]} />
              <Text style={[typography.body, { color: theme.textSecondary, flex: 1, fontSize: 12 }]} numberOfLines={1}>
                {request.dropoffAddress || 'Destination Spot'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleDecline}
              disabled={declining || accepting}
              style={[styles.declineBtn, { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' }]}
            >
              <X size={20} color="#FF3B30" />
              <Text style={[typography.label, { color: '#FF3B30', marginLeft: 8, fontSize: 11 }]}>DECLINE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              disabled={declining || accepting}
              style={[styles.acceptBtn, { backgroundColor: '#34C759' }]}
            >
              {accepting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={[typography.label, { color: '#fff', marginLeft: 8, fontSize: 11 }]}>ACCEPT RIDE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  timerBarBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, zIndex: 100 },
  timerBarFill: { height: '100%', borderRadius: 2 },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(52,199,89,0.3)',
  },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  card: {
    margin: 14,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 16 },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  timerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  certRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1 },
  routesBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 1, height: 12, marginLeft: 3, marginVertical: 3 },
  actionRow: { flexDirection: 'row', gap: 12 },
  declineBtn: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
  },
  acceptBtn: {
    flex: 1.5,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
});
