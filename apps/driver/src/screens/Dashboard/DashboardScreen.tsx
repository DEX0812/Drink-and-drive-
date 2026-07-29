import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, SafeAreaView, Text, TouchableOpacity,
  ActivityIndicator, Platform, Alert, Vibration
} from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import { Power, Star, ShieldCheck, FileText } from 'lucide-react-native';
import client from '@platform/shared/src/api/client';

interface Props {
  onNavigate?: (screen: string) => void;
  isOnline: boolean;
  onToggleOnline: (online: boolean) => Promise<boolean>;
}

export default function DashboardScreen({ onNavigate, isOnline, onToggleOnline }: Props) {
  const { theme, typography } = useTheme();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(5.0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      const { data } = await client.get('/driver/profile');
      setRating(data.rating || 5.0);
    } catch {
      // Mock default
      setRating(4.9);
    }
  };

  const handleOnlineToggle = async () => {
    setLoading(true);
    if (Platform.OS !== 'web') Vibration.vibrate(15);
    const success = await onToggleOnline(!isOnline);
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header with name and rating counter */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.label, { color: theme.textSecondary, letterSpacing: 2 }]}>DRIVER PILOT</Text>
            <Heading style={styles.title}>{user?.name?.split(' ')[0] || 'Operator'}</Heading>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <Text style={[typography.label, { color: theme.text, fontSize: 12, marginLeft: 6, fontWeight: '800' }]}>
              {rating.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Toggle Panel */}
        <View style={styles.mainToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOnlineToggle}
            disabled={loading}
            style={[
              styles.powerBtn,
              {
                backgroundColor: isOnline ? '#10B981' : theme.surface,
                borderColor: isOnline ? '#10B981' : theme.border,
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator color={isOnline ? theme.background : theme.text} size="large" />
            ) : (
              <Power size={36} color={isOnline ? theme.background : theme.textSecondary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          <Text style={[typography.h2, { color: theme.text, fontSize: 22, marginTop: 24, fontWeight: '900' }]}>
            {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
          </Text>
          
          <Text style={[typography.body, { color: theme.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'center' }]}>
            {isOnline ? 'Ready to accept designated driver requests' : 'Tap power toggle to activate duty status'}
          </Text>
        </View>

        {/* Dynamic Display when Online */}
        {isOnline ? (
          <View style={[styles.onlineStatusBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[typography.label, { color: theme.text, marginLeft: 12, letterSpacing: 1 }]}>
              Waiting for ride requests in your area...
            </Text>
          </View>
        ) : (
          <View style={styles.offlineActions}>
            {/* compliance navigation */}
            <TouchableOpacity
              onPress={() => onNavigate?.('Documents')}
              style={[styles.complianceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <FileText size={20} color="#FBBF24" />
              <View style={styles.cardText}>
                <Text style={[typography.h2, { color: theme.text, fontSize: 13, fontWeight: '800' }]}>
                  Compliance Vault
                </Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10, marginTop: 2 }]}>
                  Check license approval and insurance status.
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ShieldCheck size={20} color="#3B82F6" />
              <View style={styles.cardText}>
                <Text style={[typography.h2, { color: theme.text, fontSize: 13, fontWeight: '800' }]}>
                  Protected Duty
                </Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10, marginTop: 2 }]}>
                  All verified trips are fully insured by DriveSafe.
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

import { Heading } from '@platform/shared/src/components/Core';

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 32, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  mainToggleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  powerBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  onlineStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  offlineActions: { gap: 14, marginBottom: 16 },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardText: { marginLeft: 16, flex: 1 },
});
