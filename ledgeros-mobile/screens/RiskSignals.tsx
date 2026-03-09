// screens/RiskSignals.tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoggedInUser } from '../store/authStore';
import { api } from '../lib/api';

interface Props { user: LoggedInUser; dealId?: string; }

export default function RiskSignals({ user, dealId }: Props) {
  const [signals,  setSignals]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const isInvestor = user?.userType === 'investor';

    if (isInvestor) {
      // Investors: pull signals across all deals
      api.get<any[]>('/deals')
        .then(async (deals) => {
          if (!deals?.length) return;
          const allSignals = await Promise.all(
            deals.map((d: any) =>
              d.companies?.id
                ? api.get<any[]>(`/risk-signals/${d.companies.id}`)
                    .then(sigs => (sigs ?? []).map(s => ({ ...s, _company: d.companies?.name })))
                    .catch(() => [])
                : Promise.resolve([])
            )
          );
          setSignals(allSignals.flat());
          setCompanyName('All Portfolio Companies');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
      return;
    }

    // Business user: their own company
    const cid = user?.companyId ?? null;
    if (!cid) { setLoading(false); return; }

    Promise.all([
      api.get<any[]>(`/risk-signals/${cid}`),
      api.get<any>(`/companies/${cid}`).catch(() => null),
    ]).then(([sigs, company]) => {
      setSignals(sigs ?? []);
      if (company?.name) setCompanyName(company.name);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.companyId, user?.userType]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color="#3A6FF7" /></View>
    </SafeAreaView>
  );

  const bySeverity = (sev: string) => signals.filter(r => r.severity === sev);
  const high   = bySeverity('high');
  const medium = bySeverity('medium');
  const low    = bySeverity('low');

  const SEV_CONFIG = {
    high:   { label: 'High',   bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444', text: '#991B1B' },
    medium: { label: 'Medium', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B', text: '#92400E' },
    low:    { label: 'Low',    bg: '#F0FDF4', border: '#86EFAC', dot: '#22A06B', text: '#14532D' },
  };

  const overallScore = signals.length === 0 ? null
    : (high.length * 3 + medium.length * 2 + low.length).toFixed(0);

  const renderGroup = (sev: 'high' | 'medium' | 'low', items: any[]) => {
    if (items.length === 0) return null;
    const cfg = SEV_CONFIG[sev];
    return (
      <View key={sev} style={s.group}>
        <View style={s.groupHeader}>
          <View style={[s.groupDot, { backgroundColor: cfg.dot }]} />
          <Text style={[s.groupLabel, { color: cfg.text }]}>{cfg.label} Risk</Text>
          <View style={[s.groupCount, { backgroundColor: cfg.bg }]}>
            <Text style={[s.groupCountText, { color: cfg.text }]}>{items.length}</Text>
          </View>
        </View>
        {items.map((sig, i) => (
          <View key={i} style={[s.signalCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <View style={s.signalTop}>
              <Text style={[s.signalTitle, { color: cfg.text }]}>{sig.title}</Text>
              {sig.confidence && (
                <Text style={[s.signalConf, { color: cfg.dot }]}>{sig.confidence}% confidence</Text>
              )}
            </View>
            <Text style={s.signalDesc}>{sig.description}</Text>
            <View style={s.tagRow}>
              {sig.category && (
                <View style={[s.catBadge, { backgroundColor: cfg.dot + '20' }]}>
                  <Text style={[s.catText, { color: cfg.dot }]}>{sig.category}</Text>
                </View>
              )}
              {sig._company && (
                <View style={s.companyBadge}>
                  <Text style={s.companyBadgeText}>{sig._company}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Risk Signals</Text>
        {companyName ? <Text style={s.subtitle}>{companyName}</Text> : null}

        {signals.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No risk signals yet</Text>
            <Text style={s.emptyDesc}>Risk signals are generated automatically after document upload and AI analysis.</Text>
          </View>
        ) : (
          <>
            {/* Summary card */}
            <View style={s.summaryCard}>
              <View style={s.summaryItem}>
                <Text style={s.summaryValue}>{signals.length}</Text>
                <Text style={s.summaryLabel}>Total Signals</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryValue, { color: '#EF4444' }]}>{high.length}</Text>
                <Text style={s.summaryLabel}>High</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryValue, { color: '#F59E0B' }]}>{medium.length}</Text>
                <Text style={s.summaryLabel}>Medium</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryValue, { color: '#22A06B' }]}>{low.length}</Text>
                <Text style={s.summaryLabel}>Low</Text>
              </View>
            </View>

            {renderGroup('high',   high)}
            {renderGroup('medium', medium)}
            {renderGroup('low',    low)}
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
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#0B1F3B', marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB' },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  groupDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  groupLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  groupCount: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  groupCountText: { fontSize: 13, fontWeight: '800' },
  signalCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10 },
  signalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  signalTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  signalConf: { fontSize: 11, fontWeight: '700' },
  signalDesc: { fontSize: 13, color: '#374151', lineHeight: 18, marginBottom: 10 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catText: { fontSize: 11, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  companyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F1F2F4' },
  companyBadgeText: { fontSize: 11, fontWeight: '600', color: '#717182' },
});