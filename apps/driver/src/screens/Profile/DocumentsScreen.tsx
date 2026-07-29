import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import client from '@platform/shared/src/api/client';
import { 
  FileText, CheckCircle, Clock, AlertCircle, 
  ChevronLeft, Upload, ShieldCheck
} from 'lucide-react-native';

interface Props {
  onBack: () => void;
}

export default function DocumentsScreen({ onBack }: Props) {
  const { theme, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // Document inputs
  const [licenseUrl, setLicenseUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');
  
  const [profile, setProfile] = useState<any>(null);
  const [submittingDoc, setSubmittingDoc] = useState<'LICENSE' | 'INSURANCE' | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/driver/profile');
      setProfile(data);
      // Populate fields if already uploaded
      if (data.documents) {
        const lic = data.documents.find((d: any) => d.docType === 'LICENSE');
        if (lic) setLicenseUrl(lic.fileUrl);
        const ins = data.documents.find((d: any) => d.docType === 'VEHICLE_INSURANCE');
        if (ins) setInsuranceUrl(ins.fileUrl);
      }
    } catch {
      // Mock profile if backend is offline
      setProfile({
        verificationStatus: 'PENDING', // PENDING, APPROVED, REJECTED
        licenseNo: 'DL-98281-SAMPLE',
        rating: 5.0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (docType: 'LICENSE' | 'VEHICLE_INSURANCE', fileUrl: string) => {
    if (!fileUrl) {
      Alert.alert('URL Required', 'Please enter a valid document link/URL.');
      return;
    }
    setSubmittingDoc(docType === 'LICENSE' ? 'LICENSE' : 'INSURANCE');
    try {
      await client.post('/driver/document', { docType, fileUrl });
      Alert.alert('Uploaded', `${docType === 'LICENSE' ? 'License' : 'Vehicle Insurance'} link uploaded successfully.`);
      fetchProfile();
    } catch (err) {
      Alert.alert('Demo Mock Success', 'Link uploaded successfully (standalone mode).');
      // For mock preview, let's keep status pending/approved
    } finally {
      setSubmittingDoc(null);
    }
  };

  const handleRefreshStatus = async () => {
    Alert.alert('Status Sync', 'Checking credentials with the compliance center...');
    await fetchProfile();
  };

  const renderStatus = () => {
    if (!profile) return null;
    const status = profile.verificationStatus || 'PENDING';
    
    let color = '#FBBF24'; // PENDING
    let Icon = Clock;
    let label = 'PENDING VERIFICATION';
    
    if (status === 'APPROVED') {
      color = '#10B981';
      Icon = CheckCircle;
      label = 'VERIFICATION APPROVED';
    } else if (status === 'REJECTED') {
      color = '#EF4444';
      Icon = AlertCircle;
      label = 'VERIFICATION REJECTED';
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text, fontSize: 18, marginLeft: 16 }]}>Compliance Documents</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <ShieldCheck size={32} color={theme.primary} />
          <Text style={[typography.h1, { color: theme.text, fontSize: 24, marginTop: 12, fontWeight: '900' }]}>Compliance Hub</Text>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20 }]}>
            Upload and verify your driver credentials. You must be APPROVED to accept rides.
          </Text>
        </View>

        {renderStatus()}

        {/* Action Button: Refresh Verification Status */}
        <TouchableOpacity
          onPress={handleRefreshStatus}
          style={[styles.refreshBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Text style={[typography.label, { color: theme.text, fontSize: 11 }]}>
            REFRESH VERIFICATION STATUS
          </Text>
        </TouchableOpacity>

        {/* Upload Form */}
        <View style={styles.form}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.labelRow}>
              <FileText size={16} color={theme.primary} />
              <Text style={[typography.label, { color: theme.text, marginLeft: 8 }]}>DRIVING LICENSE URL</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={licenseUrl}
              onChangeText={setLicenseUrl}
              placeholder="e.g. mockdocs.com/my-license.png"
              placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity
              onPress={() => handleUploadDoc('LICENSE', licenseUrl)}
              disabled={submittingDoc !== null}
              style={[styles.actionBtn, { backgroundColor: theme.text }]}
            >
              {submittingDoc === 'LICENSE' ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={[typography.label, { color: theme.background, fontSize: 11 }]}>UPLOAD LICENSE</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.labelRow}>
              <ShieldCheck size={16} color={theme.primary} />
              <Text style={[typography.label, { color: theme.text, marginLeft: 8 }]}>VEHICLE INSURANCE URL</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={insuranceUrl}
              onChangeText={setInsuranceUrl}
              placeholder="e.g. mockdocs.com/insurance.pdf"
              placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity
              onPress={() => handleUploadDoc('VEHICLE_INSURANCE', insuranceUrl)}
              disabled={submittingDoc !== null}
              style={[styles.actionBtn, { backgroundColor: theme.text }]}
            >
              {submittingDoc === 'INSURANCE' ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={[typography.label, { color: theme.background, fontSize: 11 }]}>UPLOAD INSURANCE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Switch for Status */}
        {profile?.verificationStatus !== 'APPROVED' && (
          <TouchableOpacity
            style={styles.demoApproveBtn}
            onPress={() => {
              setProfile({ ...profile, verificationStatus: 'APPROVED' });
              Alert.alert('Demo Cheat', 'Account status set to APPROVED for testing purposes.');
            }}
          >
            <Text style={[typography.label, { color: '#888', fontSize: 10 }]}>[DEMO CHEAT: APPROVE PROFILE]</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 20 
  },
  refreshBtn: {
    borderWidth: 1,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  form: { gap: 20, marginBottom: 40 },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  input: { 
    height: 50, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  demoApproveBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  }
});
