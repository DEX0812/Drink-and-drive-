import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Button, Heading, Card } from '@platform/shared/src/components/Core';
import { CheckCircle } from 'lucide-react-native';

interface Props {
  fare: number;
  onBookAnother: () => void;
}

export default function SummaryScreen({ fare, onBookAnother }: Props) {
  const { theme, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.successBadge}>
          <CheckCircle size={56} color="#34C759" strokeWidth={1.5} />
        </View>

        {/* House Emoji representing arrival home */}
        <Text style={styles.houseEmoji}>🏡</Text>

        <Heading style={StyleSheet.flatten([styles.title, { color: theme.text }])}>
          Safely Home!
        </Heading>

        <Text style={[typography.body, styles.subtitle, { color: theme.textSecondary }]}>
          Your designated driver has safely driven you and your vehicle to your destination.
        </Text>

        {/* E-Receipt Card */}
        <Card style={StyleSheet.flatten([styles.receiptCard, { backgroundColor: theme.surface, borderColor: theme.border }])}>
          <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, letterSpacing: 1 }]}>
            TRANSACTION SUMMARY
          </Text>
          <View style={styles.receiptRow}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Safe Ride Home Fee</Text>
            <Text style={[typography.label, { color: theme.text }]}>₹{Math.round(fare)}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Payment Method</Text>
            <Text style={[typography.label, { color: theme.text }]}>Mock Payment (Sandbox)</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.totalRow}>
            <Text style={[typography.h2, { color: theme.text, fontSize: 16 }]}>Charged Amount</Text>
            <Text style={[typography.h1, { color: theme.primary, fontSize: 24 }]}>
              ₹{Math.round(fare)}
            </Text>
          </View>
        </Card>

        <Button
          label="BOOK ANOTHER RIDE"
          onPress={onBookAnother}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  successBadge: { marginBottom: 16 },
  houseEmoji: { fontSize: 80, marginVertical: 12 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 12, lineHeight: 20, maxWidth: '80%', marginBottom: 32 } as any,
  receiptCard: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 40,
    gap: 14,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { width: '100%' },
});
