// screens/SMEDashboard.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoggedInUser } from '../store/authStore';
import { api } from '../lib/api';

interface Props {
  user: LoggedInUser;
  onNavigateToUpload: () => void;
  onLogout: () => void;
}

export default function SMEDashboard({ user, onNavigateToUpload, onLogout }: Props) {
  const [summary,   setSummary]   = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [cashflow,  setCashflow]  = useState<number[]>([]);
  const [insights,  setInsights]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user.companyId) { setLoading(false); return; }
    const cid = user.companyId;

    Promise.all([
      api.get<any>(`/financials/${cid}/summary`),
      api.get<any[]>(`/documents/${cid}`),
      api.get<any>(`/financials/${cid}/cashflow?scenario=base`),
      api.get<any[]>(`/insights/${cid}`),
    ]).then(([sum, docs, cf, ins]) => {
      setSummary(sum);
      setDocuments(docs ?? []);
      setCashflow((cf?.forecast ?? []).map((f: any) => f.value));
      setInsights((ins ?? []).slice(0, 2));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user.companyId]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color="#3A6FF7" /></View>
    </SafeAreaView>
  );

  // Build document status buckets
  const docByCategory: Record<string, any[]> = {};
  (documents ?? []).forEach((d: any) => {
    if (!docByCategory[d.category]) docByCategory[d.category] = [];
    docByCategory[d.category].push(d);
  });
  const DOC_META: Record<string, { label: string; color: string }> = {
    financial: { label: 'Financial Statements', color: '#8B5CF6' },
    bank:      { label: 'Bank Statements',       color: '#3A6FF7' },
    contracts: { label: 'Contracts',             color: '#F59E0B' },
    tax:       { label: 'Tax Documents',         color: '#EF4444' },
  };

  const revenue = summary?.revenue ? `$${(summary.revenue / 1000000).toFixed(1)}M` : '—';
  const ebitda  = summary?.ebitda_margin ? `${summary.ebitda_margin.toFixed(1)}%` : '—';
  const growth  = summary?.revenue_growth_pct ? `+${summary.revenue_growth_pct}%` : '—';
  const months  = ['Jan','Feb','Mar','Apr','May','Jun'];
  const maxCF   = cashflow.length ? Math.max(...cashflow) : 1;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good morning,</Text>
            <Text style={s.title}>{user.name?.split(' ')[0] ?? 'there'}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroCircle1} /><View style={s.heroCircle2} />
          <Text style={s.heroCompany}>{user.company}</Text>
          <Text style={s.heroLabel}>Revenue (LTM)</Text>
          <Text style={s.heroValue}>{revenue}</Text>
          <View style={s.growthBadge}><Text style={s.growthText}>{growth} Growth</Text></View>
          <View style={s.heroDivider} />
          <View style={s.heroMetrics}>
            <View><Text style={s.heroMetaLabel}>EBITDA MARGIN</Text><Text style={s.heroMetaValue}>{ebitda}</Text></View>
          </View>
        </View>

        {/* Document status */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <Text style={s.cardTitle}>Documents</Text>
            <Text style={s.cardMeta}>{documents.length} uploaded</Text>
          </View>
          {Object.entries(DOC_META).map(([cat, meta]) => {
            const catDocs = docByCategory[cat] ?? [];
            const allDone = catDocs.length > 0 && catDocs.every((d: any) => d.status === 'completed');
            const hasParsing = catDocs.some((d: any) => d.status === 'parsing');
            const statusLabel = catDocs.length === 0 ? 'None' : allDone ? 'Uploaded' : hasParsing ? 'Processing' : 'Needs Review';
            const statusBg = allDone ? '#D1FAE5' : hasParsing ? '#DBEAFE' : '#FEF3C7';
            const statusColor = allDone ? '#065F46' : hasParsing ? '#1E40AF' : '#92400E';
            return (
              <View key={cat} style={s.docRow}>
                <View style={[s.docDot, { backgroundColor: meta.color }]} />
                <View style={s.docInfo}>
                  <Text style={s.docName}>{meta.label}</Text>
                  <Text style={s.docCount}>{catDocs.length} files</Text>
                </View>
                <View style={[s.badge, { backgroundColor: statusBg }]}>
                  <Text style={[s.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={s.uploadBtn} onPress={onNavigateToUpload} activeOpacity={0.85}>
            <Text style={s.uploadBtnText}>Upload Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Cash flow chart */}
        {cashflow.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Cash Flow Trend</Text>
            <View style={s.chartRow}>
              {cashflow.slice(0, 6).map((val, i) => (
                <View key={i} style={s.chartCol}>
                  <View style={[s.chartBar, { height: (val / maxCF) * 90, backgroundColor: '#3A6FF7' }]} />
                  <Text style={s.chartLabel}>{months[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Key Insights</Text>
            {insights.map((ins: any, i: number) => (
              <View key={i} style={s.insightRow}>
                <View style={[s.insightDot, { backgroundColor: ins.type === 'positive' ? '#22A06B' : ins.type === 'warning' ? '#F59E0B' : '#3A6FF7' }]} />
                <View style={s.insightText}>
                  <Text style={s.insightTitle}>{ins.title}</Text>
                  <Text style={s.insightDesc}>{ins.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!summary && !loading && (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No financial data yet</Text>
            <Text style={s.emptyDesc}>Upload your financial statements to generate your dashboard.</Text>
            <TouchableOpacity style={s.uploadBtn} onPress={onNavigateToUpload}>
              <Text style={s.uploadBtnText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 13, color: '#717182', fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', color: '#0B1F3B', letterSpacing: -0.5 },
  logoutBtn: { backgroundColor: '#F1F2F4', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginTop: 4 },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#717182' },
  heroCard: { backgroundColor: '#0B1F3B', borderRadius: 24, padding: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#0B1F3B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  heroCircle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -50 },
  heroCircle2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.03)', bottom: -25, left: -25 },
  heroCompany: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 6 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  heroValue: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 12 },
  growthBadge: { alignSelf: 'flex-start', backgroundColor: '#22A06B', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginBottom: 20 },
  growthText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 20 },
  heroMetrics: { flexDirection: 'row', gap: 40 },
  heroMetaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginBottom: 4 },
  heroMetaValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0B1F3B' },
  cardMeta: { fontSize: 13, color: '#717182' },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  docDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: '#0B1F3B' },
  docCount: { fontSize: 12, color: '#717182', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  uploadBtn: { backgroundColor: '#0B1F3B', height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  uploadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 6, marginBottom: 6 },
  chartLabel: { fontSize: 10, color: '#717182', fontWeight: '500' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  insightDot: { width: 34, height: 34, borderRadius: 17, marginRight: 12, marginTop: 2 },
  insightText: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: '#0B1F3B', marginBottom: 2 },
  insightDesc: { fontSize: 13, color: '#717182', lineHeight: 18 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0B1F3B', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#717182', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
});