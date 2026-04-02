import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../packages/shared/src/hooks/useAuth';
import { useTheme } from '../../../packages/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '../../../packages/shared/src/components/Core';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const { theme, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert('Fill all fields');
    setLoading(true);
    try {
      await login({ email, password });
      // Navigation will handle the state change via Auth Context
    } catch (e) {
      alert('Login failed. Check credentials.');
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
        <View style={styles.header}>
          <Heading style={styles.title}>WELCOME BACK.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            Login to access your premium fleet.
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
          <Input 
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button 
            label={loading ? "AUTHENTICATING..." : "LOG IN"} 
            onPress={handleLogin} 
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            NEW TO DRIVESAFE? 
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[typography.label, { color: theme.text, marginLeft: 5 }]}>
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 30, justifyContent: 'center' },
  header: { marginBottom: 50 },
  title: { fontSize: 42, lineHeight: 48, marginBottom: 10 },
  form: { width: '100%' },
  btn: { marginTop: 20 },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
});
