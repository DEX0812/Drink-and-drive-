import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Heading } from '@platform/shared/src/components/Core';
import { Shield } from 'lucide-react-native';

interface Props {
  fare: number;
  transmissionType: string;
  onCancel: () => void;
}

export default function MatchingScreen({ fare, transmissionType, onCancel }: Props) {
  const { theme, typography } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Pulsing Spinner Icon */}
        <Animated.View style={[styles.pulseCircle, {
          backgroundColor: theme.surface,
          borderColor: theme.primary,
          transform: [{ scale: pulseAnim }],
        }]}>
          <Shield size={40} color={theme.primary} />
        </Animated.View>

        <ActivityIndicator size="large" color={theme.text} style={styles.spinner} />

        <Heading style={StyleSheet.flatten([styles.title, { color: theme.text }])}>
          Finding Your Driver...
        </Heading>

        <Text style={[typography.body, styles.subtitle, { color: theme.textSecondary }]}>
          Broadcasting secure connection requests to certified designated drivers in your proximity.
        </Text>

        {/* Transmission & Fare Badges */}
        <View style={[styles.badgeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.badgeRow}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>REQUIRED CERTIFICATION</Text>
            <Text style={[typography.h2, { color: theme.text, fontSize: 14 }]}>
              {transmissionType.toUpperCase()} DRIVER
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.badgeRow}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>ESTIMATED PRICE</Text>
            <Text style={[typography.h1, { color: theme.primary, fontSize: 20 }]}>
              ₹{Math.round(fare)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={onCancel}
          style={[styles.cancelBtn, { borderColor: theme.error }]}
        >
          <Text style={[typography.label, { color: theme.error, fontSize: 12 }]}>CANCEL REQUEST</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 32, alignItems: 'center', width: '100%' },
  pulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  spinner: { marginBottom: 24 },
  title: { fontSize: 28, textAlign: 'center', fontWeight: '900' },
  subtitle: { textAlign: 'center', marginTop: 12, lineHeight: 20, maxWith: '80%' } as any,
  badgeContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 40,
    marginBottom: 40,
    gap: 16,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1 },
  cancelBtn: {
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
});
