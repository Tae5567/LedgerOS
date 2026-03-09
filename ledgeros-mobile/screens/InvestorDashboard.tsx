// screens/InvestorDashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoggedInUser } from '../store/authStore';
import { api } from '../lib/api';

interface Props {
  user: LoggedInUser;
  onSelectDeal: (dealId: string, companyId: string) => void;
  onLogout: () => void;
}

const DEAL_COLORS = ['#8B5CF6', '#3A6FF7', '#0D9488', '#F59E0B', '#EF4444'];

export default function InvestorDashboard({ user, onSelectDeal, onLogout }: Props) {
  const [tab,         setTab]         = useState<'pipeline' | 'discover'>('pipeline');
  const [deals,       setDeals]       = useState<any[]>([]);
  const [companies,   setCompanies]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [requesting,  setRequesting]  = useState<string | null>(null);

  const loadPipeline = useCallback(() => {
    setLoading(true);
    api.get<any[]>(`/deals?investor_id=${user.id}`)
      .then(d => setDeals(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const loadDiscover = useCallback(() => {
    setLoading(true);
    api.get<any[]>(`/deals/discover?investor_id=${user.id}`)
      .then(d => setCompanies(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    if (tab === 'pipeline') loadPipeline();
    else loadDiscover();
  }, [tab]);

  const handleRequest = async (companyId: string, companyName: string) => {
    setRequesting(companyId);
    try {
      await api.post('/deals/request', { investor_id: user.id, company_id: companyId });
      Alert.alert('Access Requested', `You've been added to ${companyName}'s deal. Check your pipeline.`);
      // Remove from discover list and switch to pipeline
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      setTab('pipeline');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setRequesting(null);
    }
  };

  const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(0)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

  const totalPipeline = deals.reduce((s, d) => s + (d.valuation_high ?? 0), 0);
  const avgRisk = deals.length ? (deals.reduce((s, d) => s + (d.risk_score ?? 0), 0) / deals.length).toFixed(1) : '—';
  const readyCount = deals.filter(d => d.status === 'ready').length;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome back,</Text>
          <Text style={s.title}>{user.name?.split(' ')[0] ?? 'Investor'}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.heroCard}>
        <View style={s.heroCircle1} /><View style={s.heroCircle2} />
        <Text style={s.heroFundName}>{user.company}</Text>
        <Text style={s.heroLabel}>Total Pipeline Value</Text>
        <Text style={s.heroValue}>{totalPipeline ? fmt(totalPipeline) : '$0'}</Text>
        <View style={s.heroMetrics}>
          <View style={s.heroMetric}><Text style={s.heroMetricValue}>{deals.length}</Text><Text style={s.heroMetricLabel}>Active Deals</Text></View>
          <View style={s.heroDividerV} />
          <View style={s.heroMetric}><Text style={s.heroMetricValue}>{avgRisk}</Text><Text style={s.heroMetricLabel}>Avg Risk</Text></View>
          <View style={s.heroDividerV} />
          <View style={s.heroMetric}><Text style={[s.heroMetricValue, { color: '#22A06B' }]}>{readyCount}</Text><Text style={s.heroMetricLabel}>Ready</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'pipeline' && s.tabBtnActive]} onPress={() => setTab('pipeline')}>
          <Text style={[s.tabText, tab === 'pipeline' && s.tabTextActive]}>My Pipeline</Text>
          {deals.length > 0 && <View style={s.tabBadge}><Text style={s.tabBadgeText}>{deals.length}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'discover' && s.tabBtnActive]} onPress={() => setTab('discover')}>
          <Text style={[s.tabText, tab === 'discover' && s.tabTextActive]}>Discover</Text>
          {companies.length > 0 && <View style={[s.tabBadge, { backgroundColor: '#22A06B' }]}><Text style={s.tabBadgeText}>{companies.length}</Text></View>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#3A6FF7" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'pipeline' ? (
            deals.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>No deals yet</Text>
                <Text style={s.emptyDesc}>Go to Discover to add companies to your pipeline.</Text>
                <TouchableOpacity style={s.discoverBtn} onPress={() => setTab('discover')}>
                  <Text style={s.discoverBtnText}>Browse Companies →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              deals.map((deal, idx) => {
                const company = deal.companies ?? {};
                const fins: any[] = (company.financials ?? []).sort((a: any, b: any) => b.year - a.year);
                const latestFin = fins[0];
                const highRisks = (company.risk_signals ?? []).filter((r: any) => r.severity === 'high').length;
                const color = DEAL_COLORS[idx % DEAL_COLORS.length];
                const initials = (company.name ?? 'UN').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                const ST: Record<string, { bg: string; text: string }> = {
                  ready:             { bg: '#D1FAE5', text: '#065F46' },
                  analyzing:         { bg: '#DBEAFE', text: '#1E40AF' },
                  requested:         { bg: '#EDE9FE', text: '#5B21B6' },
                  'needs-documents': { bg: '#FEF3C7', text: '#92400E' },
                };
                const st = ST[deal.status] ?? ST.analyzing;

                return (
                  <TouchableOpacity key={deal.id} style={s.dealCard} onPress={() => onSelectDeal(deal.id, company.id)} activeOpacity={0.88}>
                    <View style={[s.dealAccent, { backgroundColor: color }]} />
                    <View style={s.dealInner}>
                      <View style={s.dealTopRow}>
                        <View style={[s.dealAvatar, { backgroundColor: color }]}><Text style={s.dealAvatarText}>{initials}</Text></View>
                        <View style={s.dealTitleBlock}>
                          <Text style={s.dealName}>{company.name ?? 'Unknown'}</Text>
                          <Text style={s.dealIndustry}>{company.industry ?? 'Technology'}</Text>
                        </View>
                        <View style={[s.dealBadge, { backgroundColor: st.bg }]}>
                          <Text style={[s.dealBadgeText, { color: st.text }]}>{deal.status === 'needs-documents' ? 'Needs Docs' : deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}</Text>
                        </View>
                      </View>
                      <View style={s.dealMetrics}>
                        <View style={s.dealMetric}><Text style={s.dealMetricLabel}>REVENUE</Text><Text style={s.dealMetricValue}>{latestFin?.revenue ? fmt(latestFin.revenue) : '—'}</Text></View>
                        <View style={s.dealMetric}><Text style={s.dealMetricLabel}>EBITDA %</Text><Text style={s.dealMetricValue}>{latestFin?.ebitda_margin ? `${Number(latestFin.ebitda_margin).toFixed(1)}%` : '—'}</Text></View>
                        <View style={s.dealMetric}><Text style={s.dealMetricLabel}>VALUATION</Text><Text style={s.dealMetricValue}>{deal.valuation_high ? fmt(deal.valuation_high) : '—'}</Text></View>
                      </View>
                      <View style={s.dealFooter}>
                        <View style={[s.riskDot, { backgroundColor: highRisks > 0 ? '#EF4444' : '#22A06B' }]} />
                        <Text style={s.dealRisk}>Risk {deal.risk_score?.toFixed(1) ?? '—'}/10{highRisks > 0 ? `  ·  ${highRisks} high` : ''}</Text>
                        <Text style={s.dealCta}>View →</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            /* Discover tab */
            companies.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>No new companies</Text>
                <Text style={s.emptyDesc}>Companies appear here once they've completed document uploads and AI analysis.</Text>
              </View>
            ) : (
              companies.map((company: any, idx: number) => {
                const fins: any[] = (company.financials ?? []).sort((a: any, b: any) => b.year - a.year);
                const latestFin = fins[0];
                const color = DEAL_COLORS[idx % DEAL_COLORS.length];
                const initials = (company.name ?? 'CO').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                const isRequesting = requesting === company.id;

                return (
                  <View key={company.id} style={s.discoverCard}>
                    <View style={[s.discoverAccent, { backgroundColor: color }]} />
                    <View style={s.discoverInner}>
                      <View style={s.dealTopRow}>
                        <View style={[s.dealAvatar, { backgroundColor: color }]}><Text style={s.dealAvatarText}>{initials}</Text></View>
                        <View style={s.dealTitleBlock}>
                          <Text style={s.dealName}>{company.name}</Text>
                          <Text style={s.dealIndustry}>{company.industry ?? 'Technology'}</Text>
                        </View>
                        <View style={[s.docsBadge]}>
                          <Text style={s.docsBadgeText}>{(company.documents ?? []).filter((d: any) => d.status === 'completed').length} docs</Text>
                        </View>
                      </View>
                      {latestFin && (
                        <View style={s.dealMetrics}>
                          <View style={s.dealMetric}><Text style={s.dealMetricLabel}>REVENUE</Text><Text style={s.dealMetricValue}>{fmt(latestFin.revenue)}</Text></View>
                          <View style={s.dealMetric}><Text style={s.dealMetricLabel}>EBITDA %</Text><Text style={s.dealMetricValue}>{Number(latestFin.ebitda_margin).toFixed(1)}%</Text></View>
                          <View style={s.dealMetric}><Text style={s.dealMetricLabel}>YEAR</Text><Text style={s.dealMetricValue}>{latestFin.year}</Text></View>
                        </View>
                      )}
                      <TouchableOpacity
                        style={[s.requestBtn, isRequesting && s.requestBtnDisabled]}
                        onPress={() => handleRequest(company.id, company.name)}
                        disabled={isRequesting}
                        activeOpacity={0.85}
                      >
                        {isRequesting
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.requestBtnText}>+ Add to Pipeline</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 13, color: '#717182', fontWeight: '500' },
  title: { fontSize: 26, fontWeight: '800', color: '#0B1F3B', letterSpacing: -0.5 },
  logoutBtn: { backgroundColor: '#F1F2F4', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginTop: 4 },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#717182' },
  heroCard: { backgroundColor: '#0B1F3B', borderRadius: 24, padding: 22, marginHorizontal: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#0B1F3B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -60 },
  heroCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.03)', bottom: -30, left: -30 },
  heroFundName: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 4 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  heroValue: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 16 },
  heroMetrics: { flexDirection: 'row', alignItems: 'center' },
  heroMetric: { flex: 1, alignItems: 'center' },
  heroMetricValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroMetricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  heroDividerV: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  tabBtn: { flex: 1, height: 40, borderRadius: 999, backgroundColor: '#F1F2F4', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabBtnActive: { backgroundColor: '#0B1F3B' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#3A6FF7', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0B1F3B', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#717182', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  discoverBtn: { backgroundColor: '#3A6FF7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  discoverBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dealCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  dealAccent: { height: 5 },
  dealInner: { padding: 16 },
  discoverCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  discoverAccent: { height: 4 },
  discoverInner: { padding: 16 },
  dealTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dealAvatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dealAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  dealTitleBlock: { flex: 1 },
  dealName: { fontSize: 15, fontWeight: '700', color: '#0B1F3B' },
  dealIndustry: { fontSize: 12, color: '#717182', marginTop: 2 },
  dealBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dealBadgeText: { fontSize: 11, fontWeight: '700' },
  docsBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  docsBadgeText: { fontSize: 11, fontWeight: '700', color: '#3A6FF7' },
  dealMetrics: { flexDirection: 'row', backgroundColor: '#F7F8FA', borderRadius: 12, padding: 10, marginBottom: 12 },
  dealMetric: { flex: 1, alignItems: 'center' },
  dealMetricLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 3 },
  dealMetricValue: { fontSize: 13, fontWeight: '700', color: '#0B1F3B' },
  dealFooter: { flexDirection: 'row', alignItems: 'center' },
  riskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  dealRisk: { flex: 1, fontSize: 12, color: '#717182', fontWeight: '500' },
  dealCta: { fontSize: 12, fontWeight: '700', color: '#3A6FF7' },
  requestBtn: { backgroundColor: '#0B1F3B', height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  requestBtnDisabled: { opacity: 0.6 },
  requestBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});