// screens/FinancialNormalization.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoggedInUser } from '../store/authStore';
import { api } from '../lib/api';

interface Props { user: LoggedInUser; }

const SCENARIOS = ['base', 'downside', 'stress'] as const;
type Scenario = typeof SCENARIOS[number];

export default function FinancialNormalization({ user }: Props) {
  const [financials, setFinancials] = useState<any[]>([]);
  const [cashflow,   setCashflow]   = useState<any[]>([]);
  const [scenario,   setScenario]   = useState<Scenario>('base');
  const [loading,    setLoading]    = useState(true);

  const cid = user.companyId;

  useEffect(() => {
    if (!cid) { setLoading(false); return; }
    api.get<any[]>(`/financials/${cid}`)
      .then(d => setFinancials(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cid]);

  useEffect(() => {
    if (!cid) return;
    api.get<any>(`/financials/${cid}/cashflow?scenario=${scenario}`)
      .then(d => setCashflow(d?.forecast ?? []))
      .catch(console.error);
  }, [cid, scenario]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color="#3A6FF7" /></View>
    </SafeAreaView>
  );

  const fmtM = (v: number) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;
  const fmtPct = (v: number) => `${v?.toFixed(1) ?? '—'}%`;
  const maxCF = cashflow.length ? Math.max(...cashflow.map(c => c.value)) : 1;

  const scenarioColors: Record<Scenario, string> = { base: '#22A06B', downside: '#F59E0B', stress: '#EF4444' };
  const scenarioLabel: Record<Scenario, string>  = { base: 'Base', downside: 'Downside', stress: 'Stress' };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Financial Analysis</Text>
        <Text style={s.subtitle}>{user.company}</Text>

        {financials.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No financial data yet</Text>
            <Text style={s.emptyDesc}>Upload financial statements in the Documents tab to generate analysis.</Text>
          </View>
        ) : (
          <>
            {/* Year-over-year table */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Normalized Financials</Text>
              <View style={s.tableHeader}>
                <Text style={[s.tableCell, s.tableHeaderCell, { flex: 2 }]}>Metric</Text>
                {financials.map(f => (
                  <Text key={f.year} style={[s.tableCell, s.tableHeaderCell]}>{f.year}</Text>
                ))}
              </View>
              {[
                { key: 'revenue',         label: 'Revenue',       fmt: fmtM },
                { key: 'gross_margin',    label: 'Gross Margin',  fmt: fmtM },
                { key: 'gross_margin_pct',label: 'GM %',          fmt: fmtPct },
                { key: 'ebitda',          label: 'EBITDA',        fmt: fmtM },
                { key: 'ebitda_margin',   label: 'EBITDA %',      fmt: fmtPct },
              ].map(row => (
                <View key={row.key} style={s.tableRow}>
                  <Text style={[s.tableCell, s.tableRowLabel, { flex: 2 }]}>{row.label}</Text>
                  {financials.map(f => (
                    <Text key={f.year} style={s.tableCell}>{row.fmt(f[row.key] ?? 0)}</Text>
                  ))}
                </View>
              ))}
            </View>

            {/* Cash flow forecast */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Cash Flow Forecast</Text>
              <View style={s.scenarioRow}>
                {SCENARIOS.map(sc => (
                  <TouchableOpacity
                    key={sc}
                    style={[s.scenarioBtn, scenario === sc && { backgroundColor: scenarioColors[sc] }]}
                    onPress={() => setScenario(sc)}
                  >
                    <Text style={[s.scenarioBtnText, scenario === sc && { color: '#fff' }]}>{scenarioLabel[sc]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.chartRow}>
                {cashflow.map((c, i) => (
                  <View key={i} style={s.chartCol}>
                    <View style={[s.chartBar, { height: (c.value / maxCF) * 100, backgroundColor: scenarioColors[scenario] }]} />
                    <Text style={s.chartLabel}>{c.month}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
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
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0B1F3B', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  tableCell: { flex: 1, fontSize: 13, color: '#0B1F3B', textAlign: 'right' },
  tableHeaderCell: { fontWeight: '700', color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase' },
  tableRowLabel: { textAlign: 'left', fontWeight: '600', color: '#0B1F3B' },
  scenarioRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  scenarioBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F4' },
  scenarioBtnText: { fontSize: 13, fontWeight: '700', color: '#717182' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 5, marginBottom: 6 },
  chartLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '500' },
});