import React, { useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
  Animated, Platform,
} from 'react-native';
import { useTheme } from '../../../../../packages/shared/src/theme/ThemeProvider';
import { CheckCircle, Star, TrendingUp, Clock, Navigation } from 'lucide-react-native';

interface Props {
  ride: any;
  onFinish: () => void;
}

export default function TripSummaryScreen({ ride, onFinish }: Props) {
  const { theme, typography } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const earnings = ride?.price || 245;
  const distanceKm = ride?.distance || 8.4;
  const durationMin = ride?.duration || 22;
  const rating = ride?.rating || null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        {/* Success Icon */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <View style={[styles.successCircle, { backgroundColor: '#34C759' + '22', borderColor: '#34C759' }]}>
            <CheckCircle size={48} color="#34C759" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeIn, alignItems: 'center' }}>
          <Text style={[typography.label, { color: theme.textSecondary, marginTop: 20, fontSize: 10 }]}>
            MISSION COMPLETE
          </Text>
          <Text style={[typography.h1, { color: theme.text, fontSize: 36, textAlign: 'center', marginTop: 4 }]}>
            Trip Finished!
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Great job. Payment is being processed.
          </Text>
        </Animated.View>

        {/* Earnings Card */}
        <Animated.View
          style={[
            styles.earningsCard,
            { backgroundColor: theme.surface, borderColor: theme.border, opacity: fadeIn },
          ]}
        >
          <View style={styles.earningsMain}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>YOU EARNED</Text>
            <Text style={[typography.h1, { color: '#34C759', fontSize: 42, letterSpacing: -1 }]}>
              ₹{Math.round(earnings)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Navigation size={16} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.text, fontSize: 18, marginTop: 4 }]}>
                {distanceKm} km
              </Text>
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9 }]}>DISTANCE</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Clock size={16} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.text, fontSize: 18, marginTop: 4 }]}>
                {durationMin} min
              </Text>
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9 }]}>DURATION</Text>
            </View>
            {rating && (
              <>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={[typography.h2, { color: theme.text, fontSize: 18, marginTop: 4 }]}>
                    {rating}/5
                  </Text>
                  <Text style={[typography.label, { color: theme.textSecondary, fontSize: 9 }]}>RATING</Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{ opacity: fadeIn, width: '100%' }}>
          <TouchableOpacity
            onPress={onFinish}
            style={[styles.doneBtn, { backgroundColor: theme.text }]}
          >
            <TrendingUp size={18} color={theme.background} />
            <Text style={[typography.label, { color: theme.background, marginLeft: 10, letterSpacing: 1.5 }]}>
              FIND NEXT RIDE
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  earningsCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginTop: 32,
    marginBottom: 32,
  },
  earningsMain: { alignItems: 'center', marginBottom: 20 },
  divider: { height: 1, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, marginHorizontal: 8 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    width: '100%',
  },
});
