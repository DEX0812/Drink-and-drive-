import React, { useState } from 'react';
import {
  StyleSheet, View, SafeAreaView, KeyboardAvoidingView,
  Platform, Text, TouchableOpacity, Alert, ScrollView, Switch,
} from 'react-native';
import { useAuth } from '../../../../../packages/shared/src/hooks/useAuth';
import { useTheme } from '../../../../../packages/shared/src/theme/ThemeProvider';
import { Button, Input, Heading } from '../../../../../packages/shared/src/components/Core';
import { Car, Shield } from 'lucide-react-native';

export default function DriverRegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const { theme, typography } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [manualCertified, setManualCertified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !licenseNumber) {
      Alert.alert('Missing Fields', 'Please fill in all required fields including license number.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role: 'DRIVER',
        licenseNumber,
        experienceYears: parseInt(experienceYears) || 0,
        manualCertified,
      });
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.response?.data?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[typography.label, { color: theme.textSecondary, fontSize: 11 }]}>← BACK</Text>
          </TouchableOpacity>

          <Heading style={styles.title}>Driver{'\n'}Application.</Heading>
          <Text style={[typography.body, { color: theme.textSecondary, marginBottom: 32 }]}>
            Join as a professional driver — your account will be verified before activation.
          </Text>

          <Input label="FULL NAME" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="EMAIL ADDRESS" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="DRIVING LICENSE NUMBER" value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />
          <Input label="YEARS OF EXPERIENCE" value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" />

          {/* Manual Certified Toggle */}
          <View style={[styles.certRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.certInfo}>
              <Car size={18} color={theme.text} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[typography.label, { color: theme.text, fontSize: 12 }]}>MANUAL TRANSMISSION</Text>
                <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11, marginTop: 2 }]}>
                  Certified to drive manual gearbox vehicles
                </Text>
              </View>
            </View>
            <Switch
              value={manualCertified}
              onValueChange={setManualCertified}
              trackColor={{ false: theme.border, true: theme.text }}
              thumbColor="#fff"
            />
          </View>

          {/* Verification Notice */}
          <View style={[styles.notice, { backgroundColor: '#FFF8E1', borderColor: '#FFB300' }]}>
            <Shield size={14} color="#FFB300" />
            <Text style={[typography.body, { color: '#FFB300', fontSize: 11, marginLeft: 10, flex: 1 }]}>
              Your account will be reviewed by our team. You'll be activated within 24 hours.
            </Text>
          </View>

          <Button
            label={loading ? 'SUBMITTING APPLICATION...' : 'SUBMIT APPLICATION'}
            onPress={handleRegister}
            style={styles.btn}
          />

          <View style={styles.footer}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Already registered? </Text>
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
  title: { fontSize: 40, lineHeight: 44, letterSpacing: -1.5, marginBottom: 8 },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  certInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  btn: { marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
