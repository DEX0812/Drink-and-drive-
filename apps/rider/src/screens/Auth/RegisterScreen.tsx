import React, { useState } from 'react';
import {
  StyleSheet, View, SafeAreaView, KeyboardAvoidingView,
  Platform, Text, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../../../packages/shared/src/hooks/useAuth';
import { useTheme } from '../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '../../../../packages/shared/src/components/Core';
import { Shield, Car } from 'lucide-react-native';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const { theme, typography } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role });
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.response?.data?.message || 'Could not create account.');
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

          <Heading style={styles.title}>Create{'\n'}Account.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginBottom: 36 }]}>
            Join DriveSafe — reliable, safe rides
          </Text>

          {/* Role Selector */}
          <View style={styles.roleRow}>
            <TouchableOpacity
              onPress={() => setRole('RIDER')}
              style={[
                styles.roleBtn,
                {
                  backgroundColor: role === 'RIDER' ? theme.text : theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Shield size={18} color={role === 'RIDER' ? theme.background : theme.textSecondary} />
              <Text style={[typography.label, { color: role === 'RIDER' ? theme.background : theme.textSecondary, marginLeft: 8, fontSize: 11 }]}>
                I NEED A RIDE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole('DRIVER')}
              style={[
                styles.roleBtn,
                {
                  backgroundColor: role === 'DRIVER' ? theme.text : theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Car size={18} color={role === 'DRIVER' ? theme.background : theme.textSecondary} />
              <Text style={[typography.label, { color: role === 'DRIVER' ? theme.background : theme.textSecondary, marginLeft: 8, fontSize: 11 }]}>
                I WANT TO DRIVE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Input label="FULL NAME" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input label="PASSWORD (min 6 chars)" value={password} onChangeText={setPassword} secureTextEntry />

          <Button
            label={loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            onPress={handleRegister}
            style={styles.btn}
          />

          <View style={styles.footer}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[typography.label, { color: theme.text }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 32, paddingBottom: 48 },
  backBtn: { marginBottom: 32 },
  title: { fontSize: 44, lineHeight: 48, letterSpacing: -1.5, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  btn: { marginTop: 8, marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
