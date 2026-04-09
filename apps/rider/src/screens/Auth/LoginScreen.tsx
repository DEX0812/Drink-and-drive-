import React, { useState } from 'react';
import {
  StyleSheet, View, SafeAreaView, KeyboardAvoidingView,
  Platform, Text, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '@platform/shared/src/components/Core';
import { Shield } from 'lucide-react-native';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const { theme, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
    } catch (e: any) {
      const errorMsg = e.message || e?.response?.data?.message || 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', errorMsg);
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
            <Shield size={28} color={theme.background} />
          </View>
          <Text style={[typography.label, { color: theme.textSecondary, marginTop: 12, letterSpacing: 4 }]}>
            DRIVESAFE
          </Text>
        </View>

        {/* Headline */}
        <View style={styles.header}>
          <Heading style={styles.title}>Welcome{'\n'}Back.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 8 }]}>
            Sign in to request a professional driver
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            label={loading ? 'SIGNING IN...' : 'SIGN IN'}
            onPress={handleLogin}
            style={styles.btn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            New to DriveSafe?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[typography.label, { color: theme.text }]}>Create Account</Text>
          </TouchableOpacity>
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
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
