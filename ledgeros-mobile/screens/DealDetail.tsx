// screens/DealDetail.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';

interface Props {
  dealId: string;
  onBack: () => void;
}

export default function DealDetail({ dealId, onBack }: Props) {
  const [deal,    setDeal]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>(`/deals/${dealId}`)
      .then(d => setDeal(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dealId]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color="#3A6FF7" /></View>
    </SafeAreaView>
  );

  if (!deal) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.errorText}>Deal not found</Text>
        <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backBtnText}>← Go Back</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const company    = deal.companies ?? {};
  const financials: any[] = (company.financials ?? []).sort((a: any, b: any) => b.year - a.year);
  const signals: any[]    = company.risk_signals ?? [];
  const insights: any[]   = company.insights ?? [];
  const latestFin  = financials[0];

  const fmtM = (v: number) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v ?? '—'}`;
  const valRange = (deal.valuation_low && deal.valuation_high) ? `${fmtM(deal.valuation_low)} – ${fmtM(deal.valuation_high)}` : '—';

  const SEV_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#22A06B' };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <TouchableOpacity onPress={onBack} style={s.backRow}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backText}>Pipeline</Text>
        </TouchableOpacity>

        <Text style={s.title}>{company.name ?? 'Company'}</Text>
        <Text style={s.industry}>{company.industry ?? 'Technology'}</Text>

        {/* Hero metrics */}
        <View style={s.heroCard}>
          <View style={s.heroCircle1} /><View style={s.heroCircle2} />
          <View style={s.heroMetrics}>
            <View style={s.heroMetric}>
              <Text style={s.heroMetricLabel}>VALUATION</Text>
              <Text style={s.heroMetricValue}>{valRange}</Text>
            </View>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>Risk Score</Text>
              <Text style={s.heroStatValue}>{deal.risk_score?.toFixed(1) ?? '—'}/10</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>Revenue</Text>
              <Text style={s.heroStatValue}>{latestFin ? fmtM(latestFin.revenue) : '—'}</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>EBITDA %</Text>
              <Text style={s.heroStatValue}>{latestFin?.ebitda_margin?.toFixed(1) ?? '—'}%</Text>
            </View>
          </View>
        </View>

        {/* Financials */}
        {financials.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Normalized Financials</Text>
            {financials.map((f: any) => (
              <View key={f.year} style={s.finRow}>
                <Text style={s.finYear}>{f.year}</Text>
                <View style={s.finMetrics}>
                  <View style={s.finMetric}><Text style={s.finLabel}>Revenue</Text><Text style={s.finValue}>{fmtM(f.revenue)}</Text></View>
                  <View style={s.finMetric}><Text style={s.finLabel}>EBITDA</Text><Text style={s.finValue}>{fmtM(f.ebitda)}</Text></View>
                  <View style={s.finMetric}><Text style={s.finLabel}>GM %</Text><Text style={s.finValue}>{f.gross_margin_pct?.toFixed(1)}%</Text></View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Risk signals */}
        {signals.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Risk Signals</Text>
            {signals.map((sig: any, i: number) => (
              <View key={i} style={s.signalRow}>
                <View style={[s.signalDot, { backgroundColor: SEV_COLORS[sig.severity as keyof typeof SEV_COLORS] ?? '#9CA3AF' }]} />
                <View style={s.signalText}>
                  <Text style={s.signalTitle}>{sig.title}</Text>
                  <Text style={s.signalDesc}>{sig.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>AI Insights</Text>
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

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#717182', marginBottom: 16 },
  backBtn: { backgroundColor: '#0B1F3B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backArrow: { fontSize: 18, color: '#3A6FF7', marginRight: 6 },
  backText: { fontSize: 15, color: '#3A6FF7', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#0B1F3B', letterSpacing: -0.5, marginBottom: 2 },
  industry: { fontSize: 14, color: '#717182', marginBottom: 20 },
  heroCard: { backgroundColor: '#0B1F3B', borderRadius: 24, padding: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#0B1F3B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  heroCircle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -50 },
  heroCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)', bottom: -20, left: -20 },
  heroMetrics: { marginBottom: 16 },
  heroMetric: {},
  heroMetricLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  heroMetricValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  heroRow: { flexDirection: 'row' },
  heroStat: { flex: 1 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  heroStatValue: { fontSize: 17, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0B1F3B', marginBottom: 16 },
  finRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  finYear: { fontSize: 13, fontWeight: '700', color: '#0B1F3B', marginBottom: 8 },
  finMetrics: { flexDirection: 'row' },
  finMetric: { flex: 1 },
  finLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 3 },
  finValue: { fontSize: 14, fontWeight: '700', color: '#0B1F3B' },
  signalRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  signalDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  signalText: { flex: 1 },
  signalTitle: { fontSize: 14, fontWeight: '700', color: '#0B1F3B', marginBottom: 3 },
  signalDesc: { fontSize: 13, color: '#717182', lineHeight: 18 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  insightDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  insightText: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: '#0B1F3B', marginBottom: 3 },
  insightDesc: { fontSize: 13, color: '#717182', lineHeight: 18 },
});