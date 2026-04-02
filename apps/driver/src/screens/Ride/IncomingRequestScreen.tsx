import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Heading, SubHeading, Card, Spacer } from '../../../../packages/shared/src/components/Core';
import { Car, MapPin, Gauge, Clock, Navigation, MoreVertical, X } from 'lucide-react-native';

interface IncomingRequestProps {
  request: any; // Mocked request with riderName, pickupAddress, carModel, transmission
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingRequestScreen({ request, onAccept, onReject }: IncomingRequestProps) {
  const { theme, typography, mode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        <View style={styles.topBar}>
           <TouchableOpacity onPress={onReject} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
           </TouchableOpacity>
           <View style={styles.timerRing}>
              <Text style={[typography.label, { fontSize: 16, color: theme.text }]}>15s</Text>
           </View>
        </View>

        <View style={styles.header}>
          <Heading style={styles.title}>NEW REQUEST</Heading>
          <SubHeading style={{ fontSize: 16 }}>{request.serviceLevel || 'STANDARD'} RIDE</SubHeading>
        </View>

        <Card style={styles.mainCard}>
          <View style={styles.riderSummary}>
             <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                <Text style={[typography.h2, { fontSize: 24 }]}>{request.riderName?.[0] || 'R'}</Text>
             </View>
             <View style={styles.riderInfo}>
                <Text style={[typography.h2, { fontSize: 20 }]}>{request.riderName || 'Premium Client'}</Text>
                <View style={styles.ratingRow}>
                   <Text style={[typography.body, { color: theme.textSecondary }]}>★ 4.8 Rider</Text>
                </View>
             </View>
          </View>

          <Spacer size={24} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Spacer size={24} />

          <View style={styles.locationBlock}>
             <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: theme.text }]} />
                <View style={styles.locationText}>
                   <Text style={[typography.label, { fontSize: 10, color: theme.textSecondary }]}>PICKUP</Text>
                   <Text style={[typography.body, { fontSize: 16, color: theme.text }]} numberOfLines={1}>
                      {request.pickupAddress || '123 Elite Square, Bangalore'}
                   </Text>
                </View>
             </View>
             <View style={[styles.connector, { backgroundColor: theme.border }]} />
             <View style={styles.locationRow}>
                <View style={[styles.square, { backgroundColor: theme.primary }]} />
                <View style={styles.locationText}>
                   <Text style={[typography.label, { fontSize: 10, color: theme.textSecondary }]}>DROPOFF</Text>
                   <Text style={[typography.body, { fontSize: 16, color: theme.text }]} numberOfLines={1}>
                      {request.dropoffAddress || 'Tech Park, Whitefield'}
                   </Text>
                </View>
             </View>
          </View>

          <Spacer size={24} />

          <View style={styles.statsGrid}>
             <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                <Text style={[typography.label, { fontSize: 10 }]}>EST. EARNING</Text>
                <Text style={[typography.h2, { fontSize: 22, marginTop: 4 }]}>$24.50</Text>
             </View>
             <Spacer size={12} horizontal />
             <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                <Text style={[typography.label, { fontSize: 10 }]}>DISTANCE</Text>
                <Text style={[typography.h2, { fontSize: 22, marginTop: 4 }]}>2.4 KM</Text>
             </View>
          </View>
        </Card>

        <View style={styles.bottomActions}>
           <Button 
             label="ACCEPT REQUEST" 
             onPress={onAccept} 
             style={styles.mainBtn}
           />
           <Spacer size={12} />
           <TouchableOpacity style={styles.ignoreLink} onPress={onReject}>
              <Text style={[typography.label, { color: theme.textSecondary, fontSize: 12 }]}>IGNORE REQUEST</Text>
           </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  timerRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: '#34C759', alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: 40, letterSpacing: -1.5, marginBottom: 4 },
  mainCard: { padding: 24, borderRadius: 24 },
  riderSummary: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  riderInfo: { flex: 1 },
  ratingRow: { marginTop: 2 },
  divider: { height: 1, width: '100%' },
  locationBlock: { },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 16, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  square: { width: 8, height: 8 },
  connector: { width: 1, height: 24, marginLeft: 3.5, marginVertical: 4 },
  statsGrid: { flexDirection: 'row' },
  statItem: { flex: 1, padding: 16, borderRadius: 16 },
  bottomActions: { marginTop: 'auto', paddingBottom: 20 },
  mainBtn: { height: 70 },
  ignoreLink: { alignSelf: 'center', padding: 10 }
});
