import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { colors, spacing, radius } from '../../lib/theme';

const CATEGORIES = [
  { id: 'financial', label: 'Financial Statements', description: 'Income statements, balance sheets' },
  { id: 'bank', label: 'Bank Statements', description: 'Last 12 months' },
  { id: 'contracts', label: 'Contracts', description: 'Customer & supplier agreements' },
  { id: 'tax', label: 'Tax Documents', description: 'Returns, 1099s, W2s' },
] as const;

export default function DocumentsScreen() {
  const { companyId } = useAuthStore();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, string[]>>({});

  const handleUpload = async (categoryId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(categoryId);

      const formData = new FormData();
      formData.append('company_id', companyId!);
      formData.append('category', categoryId);
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      await api.uploadFile('/documents/upload', formData);

      setUploaded(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), file.name],
      }));

      Alert.alert('Uploaded', `${file.name} is being processed`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Upload Documents</Text>
        <Text style={styles.subtitle}>Required for underwriting analysis</Text>

        {CATEGORIES.map(cat => (
          <View key={cat.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{cat.label}</Text>
              <Text style={styles.fileCount}>
                {uploaded[cat.id]?.length || 0} files
              </Text>
            </View>
            <Text style={styles.cardDesc}>{cat.description}</Text>

            {(uploaded[cat.id] || []).map((name, i) => (
              <View key={i} style={styles.fileRow}>
                <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
                <Text style={[styles.fileStatus, { color: colors.green }]}>✓ Uploaded</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.uploadBtn, uploading === cat.id && styles.uploadBtnDisabled]}
              onPress={() => handleUpload(cat.id)}
              disabled={uploading === cat.id}
            >
              <Text style={styles.uploadBtnText}>
                {uploading === cat.id ? 'Uploading...' : `Upload ${cat.label}`}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.gray[500], marginBottom: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navy },
  fileCount: { fontSize: 13, color: colors.gray[500] },
  cardDesc: { fontSize: 13, color: colors.gray[500], marginBottom: 16 },
  fileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  fileName: { fontSize: 13, color: colors.navy, flex: 1, marginRight: 8 },
  fileStatus: { fontSize: 12, fontWeight: '600' },
  uploadBtn: {
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radius.full,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  uploadBtnDisabled: { borderColor: colors.gray[200] },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: colors.navy },
});