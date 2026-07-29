import React, { useState, useContext } from 'react';
import {
  StyleSheet, View, SafeAreaView, KeyboardAvoidingView,
  Platform, Text, TouchableOpacity, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '@platform/shared/src/context/AuthContext';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '@platform/shared/src/components/Core';
import { Car } from 'lucide-react-native';
import client from '@platform/shared/src/api/client';

export default function LoginScreen({ navigation }: any) {
  const authContext = useContext(AuthContext) as any;
  const { theme, typography } = useTheme();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/otp/send', { phone });
      setIsMockMode(false);
      setStep('OTP');
      Alert.alert('Code Sent', 'Check backend logs/device for verification code.');
    } catch (e: any) {
      console.warn('Send OTP failed, activating mock fallback', e);
      setIsMockMode(true);
      setStep('OTP');
      Alert.alert('Demo Mode Active', 'Using local mock flow. Enter any code or 123456 to verify.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code.');
      return;
    }
    setLoading(true);
    try {
      let token, user, needsRegistration = false;

      if (isMockMode) {
        token = 'mock_driver_token_' + Date.now();
        user = {
          id: 'mock_driver_id',
          name: 'Demo Driver',
          email: 'driver@demo.drivesafe.com',
          role: 'DRIVER',
          phone,
        };
        // Let's assume user is unregistered for first-time walkthrough simulation
        needsRegistration = true;
      } else {
        const res = await client.post('/auth/otp/verify', { phone, code: otp });
        token = res.data.token;
        user = res.data.user;
        needsRegistration = !!res.data.needsRegistration;
      }

      if (needsRegistration) {
        navigation.navigate('Register', { phone, token, isMock: isMockMode });
      } else {
        await SecureStore.setItemAsync('token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        authContext?.setToken(token);
        authContext?.setUser(user);
      }
    } catch (e: any) {
      const errorMsg = e.message || e?.response?.data?.message || 'Verification failed.';
      Alert.alert('Verification Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: theme.text }]}>
            <Car size={28} color={theme.background} />
          </View>
          <Text style={[typography.label, { color: theme.textSecondary, marginTop: 12, letterSpacing: 4 }]}>
            DRIVER HUB
          </Text>
        </View>

        {/* Headline */}
        <View style={styles.header}>
          <Heading style={styles.title}>{step === 'PHONE' ? 'Driver\nPortal.' : 'Verify\nIdentity.'}</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 8 }]}>
            {step === 'PHONE' 
              ? 'Enter your mobile number to access your driver cockpit.'
              : `Verification code dispatched to ${phone}`
            }
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {step === 'PHONE' ? (
            <>
              <Input
                label="PHONE NUMBER"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
                placeholder="e.g. +91 98765 43210"
              />
              <Button
                label={loading ? 'SENDING CODE...' : 'GET VERIFICATION CODE'}
                onPress={handleSendOtp}
                style={styles.btn}
              />
            </>
          ) : (
            <>
              <Input
                label="VERIFICATION CODE"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
                placeholder="------"
              />
              <Button
                label={loading ? 'VERIFYING...' : 'VERIFY OTP'}
                onPress={handleVerifyOtp}
                style={styles.btn}
              />
              <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.changePhoneBtn}>
                <Text style={[typography.label, { color: theme.textSecondary, textAlign: 'center', fontSize: 11 }]}>
                  ← CHANGE PHONE NUMBER
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, textAlign: 'center', opacity: 0.6 }]}>
            Maintain active background checks and licensing to remain online.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 32, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginBottom: 40 },
  title: { fontSize: 48, lineHeight: 52, letterSpacing: -1.5 },
  form: { width: '100%' },
  btn: { marginTop: 8 },
  changePhoneBtn: { marginTop: 20, paddingVertical: 10 },
  footer: { marginTop: 40, alignItems: 'center' },
});
