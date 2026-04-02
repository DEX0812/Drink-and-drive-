import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Heading, SubHeading } from '../../../../packages/shared/src/components/Core';
import { CreditCard, Star, CheckCircle, ArrowRight } from 'lucide-react-native';
import axios from 'axios';

interface PaymentRatingProps {
  ride: any;
  onComplete: () => void;
}

export default function PaymentRatingScreen({ ride, onComplete }: PaymentRatingProps) {
  const { theme, typography, mode } = useTheme();
  const [rating, setRating] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // 1. Create Payment Intent
      const response = await axios.post('http://localhost:4000/api/payments/create-intent', {
        rideId: ride.id,
        amount: 45.00 // Mocked amount
      });

      // 2. Simulate Webhook Success for Sandbox
      await axios.post('http://localhost:4000/api/payments/webhook', {
        type: 'payment_intent.succeeded',
        data: { object: { metadata: { rideId: ride.id }, amount: 4500, id: 'pi_test_' + Date.now() } }
      });

      setIsPaid(true);
    } catch (err) {
      Alert.alert('Payment Error', 'Could not process transaction.');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) return;
    try {
      await axios.post('http://localhost:4000/api/rides/rate', { rideId: ride.id, rating });
      onComplete();
    } catch (err) {
      Alert.alert('Error', 'Could not submit rating.');
    }
  };

  if (isPaid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.successInner}>
            <CheckCircle size={80} color={theme.primary} strokeWidth={1} />
            <Heading style={{ marginTop: 20 }}>TRANSACTION SUCCESSFUL.</Heading>
            <Text style={[typography.body, { textAlign: 'center', color: theme.textSecondary, marginTop: 10 }]}>
              Payment for mission {ride.id.slice(0,8)} confirmed.
            </Text>

            <View style={styles.ratingSection}>
               <SubHeading style={{ marginBottom: 20 }}>RATE YOUR DRIVER</SubHeading>
               <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                       <Star 
                          size={40} 
                          color={s <= rating ? theme.primary : theme.textSecondary} 
                          fill={s <= rating ? theme.primary : 'transparent'} 
                       />
                    </TouchableOpacity>
                  ))}
               </View>
            </View>

            <Button 
               label="FINISH & RETURN" 
               onPress={submitRating} 
               disabled={rating === 0}
               style={{ width: '100%', marginTop: 40 }}
            />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.receiptHeader}>
           <Heading style={{ fontSize: 40 }}>RECEIPT.</Heading>
           <Text style={[typography.label, { color: theme.textSecondary }]}>RIDE#{ride.id.slice(0,8)}</Text>
        </View>

        <View style={[styles.receiptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.receiptRow}>
               <Text style={typography.body}>DISTANCE (4.5 KM)</Text>
               <Text style={typography.label}>$12.50</Text>
            </View>
            <View style={styles.receiptRow}>
               <Text style={typography.body}>TIME (12 MIN)</Text>
               <Text style={typography.label}>$8.00</Text>
            </View>
            <View style={styles.receiptRow}>
               <Text style={typography.body}>PLATFORM FEE</Text>
               <Text style={typography.label}>$4.50</Text>
            </View>
            <View style={[styles.receiptDivider, { backgroundColor: theme.border }]} />
            <View style={styles.receiptRow}>
               <Text style={typography.h1}>TOTAL</Text>
               <Text style={typography.h1}>$25.00</Text>
            </View>
        </View>

        <View style={styles.paymentMethod}>
           <SubHeading style={{ marginBottom: 15 }}>PAYMENT METHOD</SubHeading>
           <View style={[styles.methodBox, { borderColor: theme.primary }]}>
              <CreditCard size={20} color={theme.text} />
              <Text style={[typography.label, { marginLeft: 15 }]}>VISA •••• 9281</Text>
           </View>
        </View>

        <Button 
           label={loading ? "PROCESS...ING" : "SECURE PAYMENT"} 
           onPress={handlePay} 
           loading={loading}
           style={styles.payBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 30 },
  successInner: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  receiptHeader: { marginTop: 40, marginBottom: 30 },
  receiptCard: { padding: 24, borderRadius: 0, borderWidth: 1 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  receiptDivider: { height: 1, marginVertical: 15 },
  paymentMethod: { marginVertical: 40 },
  methodBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderWidth: 1, 
    borderRadius: 4 
  },
  payBtn: { marginTop: 20 },
  ratingSection: { marginTop: 60, alignItems: 'center' },
  starsRow: { flexDirection: 'row', gap: 10 }
});
