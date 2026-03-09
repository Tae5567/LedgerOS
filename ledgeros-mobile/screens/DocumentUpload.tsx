// screens/DocumentUpload.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { LoggedInUser } from '../store/authStore';
import { api } from '../lib/api';

interface Props { user: LoggedInUser; }

const CATEGORIES = [
  { id: 'financial', label: 'Financial Statements', desc: 'Income statements, balance sheets', color: '#8B5CF6' },
  { id: 'bank',      label: 'Bank Statements',      desc: 'Last 12 months minimum',          color: '#3A6FF7' },
  { id: 'contracts', label: 'Contracts',             desc: 'Customer & supplier agreements',  color: '#F59E0B' },
  { id: 'tax',       label: 'Tax Documents',         desc: 'Returns, CIT filings',            color: '#EF4444' },
] as const;

export default function DocumentUpload({ user }: Props) {
  const [serverDocs, setServerDocs] = useState<Record<string, any[]>>({});
  const [uploading,  setUploading]  = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Pull existing documents from server on mount
  useEffect(() => {
    if (!user.companyId) { setLoadingDocs(false); return; }
    api.get<any[]>(`/documents/${user.companyId}`)
      .then(docs => {
        const grouped: Record<string, any[]> = {};
        (docs ?? []).forEach(d => {
          if (!grouped[d.category]) grouped[d.category] = [];
          grouped[d.category].push(d);
        });
        setServerDocs(grouped);
      })
      .catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, [user.companyId]);

  const handleUpload = async (categoryId: string) => {
    if (!user.companyId) { Alert.alert('Error', 'No company ID found for this account.'); return; }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        multiple: false,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(categoryId);

      const formData = new FormData();
      formData.append('company_id', user.companyId);
      formData.append('category', categoryId);
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/pdf' } as any);

      const res = await api.uploadFile('/documents/upload', formData);

      // Optimistically add to local state
      setServerDocs(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] ?? []), { ...res.document, file_name: file.name }],
      }));
      Alert.alert('Uploaded', `${file.name} is being processed. This may take a minute.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(null);
    }
  };

  const STATUS_LABEL: Record<string, string> = {
    parsing: 'Processing…', completed: '✓ Done', error: '⚠ Error', uploading: 'Uploading…',
  };
  const STATUS_COLOR: Record<string, string> = {
    parsing: '#3A6FF7', completed: '#22A06B', error: '#EF4444', uploading: '#F59E0B',
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Documents</Text>
        <Text style={s.subtitle}>Upload your financial documents for AI-powered analysis</Text>

        {loadingDocs ? (
          <View style={s.center}><ActivityIndicator color="#3A6FF7" /></View>
        ) : (
          CATEGORIES.map(cat => {
            const catDocs = serverDocs[cat.id] ?? [];
            return (
              <View key={cat.id} style={s.card}>
                <View style={[s.cardAccent, { backgroundColor: cat.color }]} />
                <View style={s.cardBody}>
                  <View style={s.cardHeaderRow}>
                    <Text style={s.cardTitle}>{cat.label}</Text>
                    <Text style={s.fileCount}>{catDocs.length} {catDocs.length === 1 ? 'file' : 'files'}</Text>
                  </View>
                  <Text style={s.cardDesc}>{cat.desc}</Text>

                  {catDocs.map((doc, i) => (
                    <View key={i} style={s.fileRow}>
                      <Text style={s.fileName} numberOfLines={1}>{doc.file_name}</Text>
                      <Text style={[s.fileStatus, { color: STATUS_COLOR[doc.status] ?? '#717182' }]}>
                        {STATUS_LABEL[doc.status] ?? doc.status}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[s.uploadBtn, uploading === cat.id && s.uploadBtnDisabled]}
                    onPress={() => handleUpload(cat.id)}
                    disabled={uploading !== null}
                    activeOpacity={0.85}
                  >
                    {uploading === cat.id
                      ? <ActivityIndicator color="#0B1F3B" size="small" />
                      : <Text style={s.uploadBtnText}>+ Upload {cat.label}</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { paddingVertical: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#0B1F3B', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#717182', marginBottom: 24, lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardAccent: { height: 5 },
  cardBody: { padding: 18 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0B1F3B' },
  fileCount: { fontSize: 12, color: '#717182' },
  cardDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 14 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  fileName: { flex: 1, fontSize: 13, color: '#0B1F3B', marginRight: 10 },
  fileStatus: { fontSize: 12, fontWeight: '600' },
  uploadBtn: { borderWidth: 2, borderColor: '#0B1F3B', borderRadius: 999, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  uploadBtnDisabled: { borderColor: '#E5E7EB' },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#0B1F3B' },
});