import React, { useState, useContext } from 'react';
import {
  StyleSheet, View, SafeAreaView, KeyboardAvoidingView,
  Platform, Text, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '@platform/shared/src/context/AuthContext';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '@platform/shared/src/components/Core';
import client from '@platform/shared/src/api/client';

export default function RegisterScreen({ route, navigation }: any) {
  const authContext = useContext(AuthContext) as any;
  const { theme, typography } = useTheme();

  // Retrieve parameters from LoginScreen OTP step
  const paramPhone = route?.params?.phone || '';
  const paramToken = route?.params?.token || '';
  const isMock = route?.params?.isMock || false;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(paramPhone);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [transmissionType, setTransmissionType] = useState<'MANUAL' | 'AUTOMATIC'>('AUTOMATIC');
  const [plateNo, setPlateNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !make || !model || !plateNo) {
      Alert.alert('Missing Fields', 'Please fill in all personal and vehicle details.');
      return;
    }
    setLoading(true);
    try {
      let finalToken, finalUser;

      if (isMock) {
        finalToken = paramToken || 'mock_jwt_token_' + Date.now();
        finalUser = {
          id: 'mock_rider_id',
          name,
          email,
          phone,
          role: 'RIDER',
          vehicle: { make, model, transmissionType, plateNo }
        };
      } else {
        const payload = { name, phone, email, make, model, transmissionType, plateNo };
        const res = await client.post('/auth/register/rider', payload);
        finalToken = res.data.token;
        finalUser = res.data.user;
      }

      await SecureStore.setItemAsync('token', finalToken);
      await SecureStore.setItemAsync('user', JSON.stringify(finalUser));
      client.defaults.headers.common['Authorization'] = `Bearer ${finalToken}`;

      authContext?.setToken(finalToken);
      authContext?.setUser(finalUser);
    } catch (e: any) {
      const errorMsg = e.message || e?.response?.data?.message || 'Could not create rider profile.';
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 11 }]}>← BACK</Text>
          </TouchableOpacity>

          <Heading style={styles.title}>Register{'\n'}Profile.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginBottom: 28 }]}>
            Set up your details and vehicle to continue
          </Text>

          {/* Personal Info */}
          <Text style={[typography.label, { color: theme.primary, marginBottom: 12, fontSize: 11, letterSpacing: 1.5 }]}>
            PERSONAL DETAILS
          </Text>
          <Input label="FULL NAME" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!paramPhone}
          />

          <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />

          {/* Vehicle Info */}
          <Text style={[typography.label, { color: theme.primary, marginBottom: 12, fontSize: 11, letterSpacing: 1.5 }]}>
            VEHICLE PROFILE
          </Text>
          <Input label="VEHICLE MAKE" value={make} onChangeText={setMake} placeholder="e.g. Honda" />
          <Input label="VEHICLE MODEL" value={model} onChangeText={setModel} placeholder="e.g. Civic" />
          
          <View style={styles.selectorGroup}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 10, marginBottom: 8 }]}>
              TRANSMISSION TYPE
            </Text>
            <View style={styles.transmissionRow}>
              <TouchableOpacity
                onPress={() => setTransmissionType('AUTOMATIC')}
                style={[
                  styles.selectorBtn,
                  {
                    backgroundColor: transmissionType === 'AUTOMATIC' ? theme.text : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[typography.label, { color: transmissionType === 'AUTOMATIC' ? theme.background : theme.textSecondary, fontSize: 11 }]}>
                  AUTOMATIC
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTransmissionType('MANUAL')}
                style={[
                  styles.selectorBtn,
                  {
                    backgroundColor: transmissionType === 'MANUAL' ? theme.text : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[typography.label, { color: transmissionType === 'MANUAL' ? theme.background : theme.textSecondary, fontSize: 11 }]}>
                  MANUAL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input label="LICENSE PLATE NUMBER" value={plateNo} onChangeText={setPlateNo} autoCapitalize="characters" placeholder="e.g. KA-01-AB-1234" />

          <Button
            label={loading ? 'REGISTERING...' : 'REGISTER & CONTINUE'}
            onPress={handleRegister}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 32, paddingBottom: 48 },
  backBtn: { marginBottom: 24 },
  title: { fontSize: 40, lineHeight: 44, letterSpacing: -1.5, marginBottom: 8 },
  sectionDivider: { height: 1, marginVertical: 24, opacity: 0.5 },
  selectorGroup: { marginBottom: 20 },
  transmissionRow: { flexDirection: 'row', gap: 10 },
  selectorBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btn: { marginTop: 16 },
});
