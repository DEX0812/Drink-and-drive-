import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import client from '@platform/shared/src/api/client';
import { 
  FileText, CheckCircle, Clock, AlertCircle, 
  ChevronLeft, Upload, ShieldCheck, Info
} from 'lucide-react-native';

interface Props {
  onBack: () => void;
}

export default function DocumentsScreen({ onBack }: Props) {
  const { theme, typography, mode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [docs, setDocs] = useState({
    licenseUrl: '',
    insuranceUrl: '',
    backgroundCheckUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await client.get('/driver/profile');
      setProfile(data);
      setDocs({
        licenseUrl: data.licenseUrl || '',
        insuranceUrl: data.insuranceUrl || '',
        backgroundCheckUrl: data.backgroundCheckUrl || '',
      });
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docs.licenseUrl || !docs.insuranceUrl) {
      Alert.alert('Incomplete', 'Please provide at least your Driving License and Insurance.');
      return;
    }

    setSaving(true);
    try {
      await client.patch('/driver/documents', docs);
      Alert.alert('Success', 'Documents submitted for review. Your status is now PENDING.');
      onBack();
    } catch {
      Alert.alert('Error', 'Failed to update documents');
    } finally {
      setSaving(false);
    }
  };

  const renderStatus = () => {
    if (!profile) return null;
    const status = profile.status;
    
    let color = '#FBBF24'; // Pending
    let Icon = Clock;
    let label = 'PENDING VERIFICATION';
    
    if (status === 'ACTIVE') {
      color = '#10B981';
      Icon = CheckCircle;
      label = 'VERIFIED';
    } else if (status === 'REJECTED') {
      color = '#EF4444';
      Icon = AlertCircle;
      label = 'REJECTED - PLEASE UPDATE';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '15', borderColor: color }]}>
        <Icon size={14} color={color} />
        <Text style={[typography.label, { color, fontSize: 10, marginLeft: 8, fontWeight: '900' }]}>{label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text, fontSize: 18, marginLeft: 16 }]}>Verification Vault</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <ShieldCheck size={32} color={theme.primary} />
          <Text style={[typography.h1, { color: theme.text, fontSize: 24, marginTop: 12, fontWeight: '900' }]}>Trust & Safety</Text>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20 }]}>
            To protect the DriveSafe community, all drivers must maintain active documentation. 
            Upload clear digital copies of the following items.
          </Text>
        </View>

        {renderStatus()}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
               <FileText size={14} color={theme.textSecondary} />
               <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 8 }]}>DRIVING LICENSE (URL/ID)</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={docs.licenseUrl}
              onChangeText={(v) => setDocs({ ...docs, licenseUrl: v })}
              placeholder="e.g. gdrive.com/my-license.pdf"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
               <ShieldCheck size={14} color={theme.textSecondary} />
               <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 8 }]}>VEHICLE INSURANCE (URL/ID)</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={docs.insuranceUrl}
              onChangeText={(v) => setDocs({ ...docs, insuranceUrl: v })}
              placeholder="e.g. dropbox.com/insurance.jpg"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
             <View style={styles.labelRow}>
               <Info size={14} color={theme.textSecondary} />
               <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 8 }]}>BACKGROUND CHECK (OPTIONAL)</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={docs.backgroundCheckUrl}
              onChangeText={(v) => setDocs({ ...docs, backgroundCheckUrl: v })}
              placeholder="Link to background check clearance"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: theme.text, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <>
              <Upload size={18} color={theme.background} />
              <Text style={[typography.label, { color: theme.background, marginLeft: 10, fontWeight: '900' }]}>SUBMIT FOR REVIEW</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[typography.body, { color: theme.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 24, lineHeight: 16 }]}>
          Verification typically takes 24-48 hours. Our security team will notify you via the dashboard once approved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoBox: { alignItems: 'center', marginBottom: 24 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 32 
  },
  form: { gap: 20, marginBottom: 40 },
  inputGroup: { gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  input: { 
    height: 56, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: { 
    height: 64, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
});
