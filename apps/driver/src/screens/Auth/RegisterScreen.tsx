import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../packages/shared/src/hooks/useAuth';
import { useTheme } from '../../../packages/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '../../../packages/shared/src/components/Core';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const { theme, typography } = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return alert('Fill all fields');
    setLoading(true);
    try {
      // Explicitly registering as DRIVER
      await register({ name, email, password, role: 'DRIVER' });
    } catch (e) {
      alert('Registration failed. Try again.');
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[typography.label, { color: theme.textSecondary }]}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Heading style={styles.title}>COMMAND THE DRIVE.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            Join as a professional driver and verify your profile.
          </Text>
        </View>

        <View style={styles.form}>
          <Input 
            label="FULL NAME"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input 
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input 
            label="CHOOSE PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button 
            label={loading ? "VERIFYING..." : "JOIN FLEET"} 
            onPress={handleRegister} 
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>
            ALREADY JOINED? 
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[typography.label, { color: theme.text, marginLeft: 5 }]}>
              LOG IN
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
  back: { position: 'absolute', top: 60, left: 30 },
  header: { marginBottom: 30 },
  title: { fontSize: 42, lineHeight: 48, marginBottom: 10 },
  form: { width: '100%' },
  btn: { marginTop: 20 },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
});
