// screens/InsightsFeed.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoggedInUser } from '../store/authStore';
import { api } from '../lib/api';

interface Props { user: LoggedInUser; }

export default function InsightsFeed({ user }: Props) {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const cid = user.companyId;
    if (!cid) { setLoading(false); return; }
    api.get<any[]>(`/insights/${cid}`)
      .then(d => setInsights(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.companyId]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color="#3A6FF7" /></View>
    </SafeAreaView>
  );

  const TYPE_CFG = {
    positive: { bg: '#F0FDF4', border: '#86EFAC', dot: '#22A06B', label: 'Positive' },
    warning:  { bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B', label: 'Warning'  },
    neutral:  { bg: '#EFF6FF', border: '#93C5FD', dot: '#3A6FF7', label: 'Neutral'  },
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Insights</Text>
        <Text style={s.subtitle}>{user.company}</Text>

        {insights.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No insights yet</Text>
            <Text style={s.emptyDesc}>AI-generated insights appear here after your documents are processed.</Text>
          </View>
        ) : (
          insights.map((ins, i) => {
            const cfg = TYPE_CFG[ins.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.neutral;
            return (
              <View key={i} style={[s.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <View style={s.cardTop}>
                  <View style={[s.dot, { backgroundColor: cfg.dot }]} />
                  <Text style={[s.typeBadge, { color: cfg.dot }]}>{cfg.label}</Text>
                  {ins.confidence && (
                    <Text style={s.confidence}>{ins.confidence}% confidence</Text>
                  )}
                </View>
                <Text style={s.insightTitle}>{ins.title}</Text>
                <Text style={s.insightDesc}>{ins.description}</Text>
                {ins.data_source && (
                  <Text style={s.dataSource}>Source: {ins.data_source}</Text>
                )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#0B1F3B', letterSpacing: -0.5, marginBottom: 2 },
  subtitle: { fontSize: 14, color: '#717182', marginBottom: 24 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0B1F3B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#717182', textAlign: 'center', lineHeight: 18 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  typeBadge: { fontSize: 12, fontWeight: '700', flex: 1 },
  confidence: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  insightTitle: { fontSize: 15, fontWeight: '700', color: '#0B1F3B', marginBottom: 6 },
  insightDesc: { fontSize: 13, color: '#374151', lineHeight: 19 },
  dataSource: { fontSize: 11, color: '#9CA3AF', marginTop: 10, fontStyle: 'italic' },
});