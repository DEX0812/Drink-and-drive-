import React, { useState } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Heading, SubHeading } from '../../../../packages/shared/src/components/Core';
import client from '../../../../packages/shared/src/api/client';
import { CreditCard, Star, CheckCircle } from 'lucide-react-native';

interface PaymentRatingProps {
  ride: any;
  onComplete: () => void;
}

export default function PaymentRatingScreen({ ride, onComplete }: PaymentRatingProps) {
  const { theme, typography } = useTheme();
  const [rating, setRating] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const price = ride?.price || 0;
  const distanceKm = ride?.distance || 0;
  const baseFare = Math.round(price * 0.4);
  const distanceFare = Math.round(price * 0.45);
  const platformFee = Math.round(price * 0.15);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Create payment intent
      const { data } = await client.post('/payments/create-intent', {
        rideId: ride.id,
        amount: price,
      });

      // Simulate webhook for sandbox
      await client.post('/payments/webhook', {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            metadata: { rideId: ride.id },
            amount: Math.round(price * 100),
            id: `pi_test_${Date.now()}`,
          },
        },
      });

      setIsPaid(true);
    } catch (err) {
      Alert.alert('Payment Error', 'Could not process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before finishing.');
      return;
    }
    setRatingLoading(true);
    try {
      await client.post('/rides/rate', { rideId: ride.id, rating });
      onComplete();
    } catch {
      // Even if rating fails, let user continue
      onComplete();
    } finally {
      setRatingLoading(false);
    }
  };

  if (isPaid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.successInner}>
          <CheckCircle size={80} color="#34C759" strokeWidth={1.5} />
          <Heading style={{ marginTop: 24, textAlign: 'center', fontSize: 32 }}>
            Payment{'\n'}Successful!
          </Heading>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 12 }]}>
            Ride #{ride.id?.slice(0, 8)} confirmed · ₹{Math.round(price)} paid
          </Text>

          {/* Rating */}
          <View style={styles.ratingSection}>
            <SubHeading style={{ marginBottom: 8, textAlign: 'center' }}>Rate Your Driver</SubHeading>
            <Text style={[typography.body, { color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 20 }]}>
              Your feedback helps keep our drivers top-rated
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn}>
                  <Star
                    size={44}
                    color={s <= rating ? '#FFD700' : theme.border}
                    fill={s <= rating ? '#FFD700' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            label={ratingLoading ? 'SUBMITTING...' : 'FINISH & GO HOME'}
            onPress={submitRating}
            style={{ width: '100%', marginTop: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          <Heading style={{ fontSize: 44, letterSpacing: -1.5 }}>Receipt.</Heading>
          <Text style={[typography.label, { color: theme.textSecondary, fontSize: 11 }]}>
            RIDE #{ride.id?.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        {/* Receipt Card */}
        <View style={[styles.receiptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.receiptRow}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Base Fare</Text>
            <Text style={[typography.label, { color: theme.text }]}>₹{baseFare}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>
              Distance ({distanceKm > 0 ? distanceKm.toFixed(1) : '—'} km)
            </Text>
            <Text style={[typography.label, { color: theme.text }]}>₹{distanceFare}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Platform Fee</Text>
            <Text style={[typography.label, { color: theme.text }]}>₹{platformFee}</Text>
          </View>
          <View style={[styles.receiptDivider, { backgroundColor: theme.border }]} />
          <View style={styles.receiptRow}>
            <Text style={[typography.h1, { color: theme.text, fontSize: 20 }]}>TOTAL</Text>
            <Text style={[typography.h1, { color: theme.text, fontSize: 20 }]}>
              ₹{Math.round(price)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <SubHeading style={{ marginBottom: 14 }}>Payment Method</SubHeading>
          <View style={[styles.methodBox, { borderColor: theme.text, backgroundColor: theme.surface }]}>
            <CreditCard size={22} color={theme.text} />
            <Text style={[typography.label, { marginLeft: 14, color: theme.text }]}>
              VISA •••• 9281
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        {loading ? (
          <View style={[styles.loadingBtn, { backgroundColor: theme.surface }]}>
            <ActivityIndicator color={theme.text} />
            <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 12 }]}>
              PROCESSING...
            </Text>
          </View>
        ) : (
          <Button
            label={`SECURE PAYMENT — ₹${Math.round(price)}`}
            onPress={handlePay}
            style={styles.payBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 32, paddingBottom: 48 },
  successInner: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  receiptHeader: { marginTop: 20, marginBottom: 28 },
  receiptCard: { padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 32 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  receiptDivider: { height: 1, marginVertical: 12 },
  paymentMethod: { marginBottom: 32 },
  methodBox: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, borderWidth: 1.5, borderRadius: 14,
  },
  payBtn: { marginTop: 8 },
  loadingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, borderRadius: 14,
  },
  ratingSection: { marginTop: 48, alignItems: 'center', width: '100%' },
  starsRow: { flexDirection: 'row', gap: 8 },
  starBtn: { padding: 4 },
});
