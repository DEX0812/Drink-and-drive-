import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Heading, SubHeading, Card, Spacer } from '../../../../../packages/shared/src/components/Core';
import { Car, User, Shield, Info, Clock, Users } from 'lucide-react-native';

const RIDE_TYPES = [
  { id: 'STANDARD', name: 'DriveSafe Go', price: '$12.50', eta: '4 min', icon: <Car size={24} />, capacity: 4 },
  { id: 'PREMIUM', name: 'DriveSafe Black', price: '$24.00', eta: '6 min', icon: <Shield size={24} />, capacity: 4 },
  { id: 'HIRING', name: 'Private Driver', price: '$18/hr', eta: '12 min', icon: <User size={24} />, capacity: 'N/A' },
];

export default function BookingBottomSheet() {
  const { theme, typography, mode } = useTheme();
  const snapPoints = useMemo(() => ['35%', '85%'], []);
  const [selectedRide, setSelectedRide] = useState('STANDARD');

  const renderRideCard = (item: typeof RIDE_TYPES[0]) => {
    const isSelected = selectedRide === item.id;
    return (
      <TouchableOpacity 
        key={item.id}
        onPress={() => setSelectedRide(item.id)}
        activeOpacity={0.8}
      >
        <Card style={[
          styles.rideCard, 
          { 
            borderColor: isSelected ? theme.text : theme.border,
            backgroundColor: isSelected ? (mode === 'light' ? '#F0F0F0' : '#252525') : theme.background
          }
        ]}>
          <View style={styles.cardHeader}>
             <View style={[styles.iconCircle, { backgroundColor: isSelected ? theme.text : theme.surface }]}>
                {React.cloneElement(item.icon as any, { color: isSelected ? theme.background : theme.text })}
             </View>
             <View style={styles.cardInfo}>
                <Text style={[typography.h2, { fontSize: 18, color: theme.text }]}>{item.name}</Text>
                <View style={styles.metaRow}>
                   <Clock size={12} color={theme.textSecondary} />
                   <Text style={[typography.body, { color: theme.textSecondary, marginLeft: 4, fontSize: 12 }]}>{item.eta} away</Text>
                   <Spacer size={12} horizontal />
                   <Users size={12} color={theme.textSecondary} />
                   <Text style={[typography.body, { color: theme.textSecondary, marginLeft: 4, fontSize: 12 }]}>{item.capacity}</Text>
                </View>
             </View>
             <Text style={[typography.h2, { fontSize: 20, color: theme.text }]}>{item.price}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 40, height: 4 }}
    >
      <BottomSheetView style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
             <Heading style={styles.title}>CHOOSE A RIDE</Heading>
             <Info size={20} color={theme.textSecondary} />
          </View>
          
          <Spacer size={20} />

          <View style={styles.rideList}>
            {RIDE_TYPES.map(renderRideCard)}
          </View>

          <Spacer size={24} />

          <View style={[styles.paymentRow, { borderTopWidth: 1, borderColor: theme.border }]}>
             <View style={styles.paymentMethod}>
                <View style={[styles.pmDot, { backgroundColor: '#34C759' }]} />
                <Text style={[typography.label, { color: theme.text, fontSize: 10 }]}>VISA •••• 4242</Text>
             </View>
             <TouchableOpacity>
                <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10 }]}>Change</Text>
             </TouchableOpacity>
          </View>

          <Spacer size={20} />

          <Button 
            label={`CONFIRM ${selectedRide}`} 
            onPress={() => console.log('Booking...', selectedRide)} 
          />
          <Spacer size={20} />
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, letterSpacing: -1 },
  rideList: { gap: 12 },
  rideCard: { padding: 16, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  paymentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 20 
  },
  paymentMethod: { flexDirection: 'row', alignItems: 'center' },
  pmDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 }
});
