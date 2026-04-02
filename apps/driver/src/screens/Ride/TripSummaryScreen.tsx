import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Heading, SubHeading } from '../../../../packages/shared/src/components/Core';
import { CheckCircle2, TrendingUp, Clock, Map } from 'lucide-react-native';

interface TripSummaryProps {
  ride: any;
  onFinish: () => void;
}

export default function TripSummaryScreen({ ride, onFinish }: TripSummaryProps) {
  const { theme, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.successHeader}>
           <CheckCircle2 size={100} color={theme.primary} strokeWidth={1} />
           <Heading style={styles.title}>MISSION COMPLETE.</Heading>
           <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center' }]}>
             You've successfully delivered rider Siddharth to their destination.
           </Text>
        </View>

        <View style={styles.metricsGrid}>
           <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TrendingUp size={24} color={theme.primary} />
              <Text style={[typography.label, { marginTop: 15, color: theme.textSecondary }]}>GROSS EARNING</Text>
              <Text style={[typography.h2, { marginTop: 5 }]}>$25.00</Text>
           </View>
           
           <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Clock size={24} color={theme.primary} />
              <Text style={[typography.label, { marginTop: 15, color: theme.textSecondary }]}>DURATION</Text>
              <Text style={[typography.h2, { marginTop: 5 }]}>14:30</Text>
           </View>

           <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Map size={24} color={theme.primary} />
              <Text style={[typography.label, { marginTop: 15, color: theme.textSecondary }]}>TOTAL DISTANCE</Text>
              <Text style={[typography.h2, { marginTop: 5 }]}>4.2 KM</Text>
           </View>
        </View>

        <View style={styles.rewardBox}>
           <SubHeading>COMMENDATIONS</SubHeading>
           <View style={styles.commendationRow}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>Excellent Navigation</Text>
              <Text style={typography.label}>+ $2.00 Tip</Text>
           </View>
        </View>

        <Button 
           label="READY FOR NEXT" 
           onPress={onFinish} 
           style={styles.actionBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 30, alignItems: 'center' },
  successHeader: { marginTop: 60, alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 40, lineHeight: 44, textAlign: 'center', marginVertical: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, width: '100%', justifyContent: 'center' },
  metricCard: { 
    width: '45%', 
    padding: 24, 
    borderRadius: 0, 
    borderWidth: 1, 
    alignItems: 'flex-start' 
  },
  rewardBox: { width: '100%', marginVertical: 40, padding: 25, borderTopWidth: 1, borderColor: '#eee' },
  commendationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  actionBtn: { width: '100%', marginTop: 20 }
});
