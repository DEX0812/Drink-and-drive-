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

  const paramPhone = route?.params?.phone || '';
  const paramToken = route?.params?.token || '';
  const isMock = route?.params?.isMock || false;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(paramPhone);
  const [licenseNo, setLicenseNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !licenseNo) {
      Alert.alert('Missing Fields', 'Please fill in all details.');
      return;
    }
    setLoading(true);
    try {
      let finalToken, finalUser;

      if (isMock) {
        finalToken = paramToken || 'mock_driver_token_' + Date.now();
        finalUser = {
          id: 'mock_driver_id',
          name,
          email,
          phone,
          role: 'DRIVER',
          driverProfile: {
            licenseNo,
            verificationStatus: 'PENDING',
            rating: 5.0,
            isOnline: false,
          }
        };
      } else {
        const payload = { name, phone, email, licenseNo };
        const res = await client.post('/auth/register/driver', payload);
        finalToken = res.data.token;
        finalUser = res.data.user;
      }

      await SecureStore.setItemAsync('token', finalToken);
      await SecureStore.setItemAsync('user', JSON.stringify(finalUser));
      client.defaults.headers.common['Authorization'] = `Bearer ${finalToken}`;

      authContext?.setToken(finalToken);
      authContext?.setUser(finalUser);
    } catch (e: any) {
      const errorMsg = e.message || e?.response?.data?.message || 'Could not register driver profile.';
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

          <Heading style={styles.title}>Apply to{'\n'}Drive.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginBottom: 32 }]}>
            Submit your information to create a certified driver account
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
          <Input
            label="DRIVING LICENSE NUMBER"
            value={licenseNo}
            onChangeText={setLicenseNo}
            autoCapitalize="characters"
            placeholder="e.g. DL-123456789"
          />

          <Button
            label={loading ? 'SUBMITTING APPLICATION...' : 'SUBMIT APPLICATION'}
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
  backBtn: { marginBottom: 32 },
  title: { fontSize: 40, lineHeight: 44, letterSpacing: -1.5, marginBottom: 8 },
  btn: { marginTop: 16 },
});
