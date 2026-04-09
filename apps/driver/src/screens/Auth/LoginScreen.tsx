import React, { useState } from 'react';
import {
  StyleSheet, View, SafeAreaView, KeyboardAvoidingView,
  Platform, Text, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '@platform/shared/src/components/Core';
import { Car } from 'lucide-react-native';

export default function DriverLoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const { theme, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
    } catch (e: any) {
      // Prioritize the custom error.message (like Network Connection Failed)
      const errorMsg = e.message || e?.response?.data?.message || 'Invalid credentials.';
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
            <Car size={28} color={theme.background} />
          </View>
          <Text style={[typography.label, { color: theme.textSecondary, marginTop: 10, letterSpacing: 4 }]}>
            DRIVER HUB
          </Text>
        </View>

        <View style={styles.header}>
          <Heading style={styles.title}>Driver{'\n'}Portal.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 8 }]}>
            Sign in to start accepting ride missions
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry />
          <Button label={loading ? 'SIGNING IN...' : 'SIGN IN'} onPress={handleLogin} style={styles.btn} />
        </View>

        <View style={styles.footer}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>New driver? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[typography.label, { color: theme.text }]}>Apply Now</Text>
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
  form: {},
  btn: { marginTop: 8 },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
