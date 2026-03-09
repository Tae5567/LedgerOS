import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const companies = [
  { id: 1, name: 'Acme Technologies Inc.', industry: 'SaaS',           revenue: 3.2, ebitda: 24.5, evRev: '3.4x', evEbitda: '11.8x', geo: 'North America', highlight: true  },
  { id: 2, name: 'TechCorp Solutions',     industry: 'SaaS',           revenue: 2.8, ebitda: 22.1, evRev: '3.2x', evEbitda: '11.5x', geo: 'North America', highlight: false },
  { id: 3, name: 'Digital Innovations',    industry: 'SaaS',           revenue: 3.5, ebitda: 26.8, evRev: '3.5x', evEbitda: '12.2x', geo: 'Europe',        highlight: false },
  { id: 4, name: 'CloudFirst Inc.',        industry: 'Infrastructure', revenue: 3.1, ebitda: 23.7, evRev: '3.3x', evEbitda: '11.8x', geo: 'North America', highlight: false },
  { id: 5, name: 'DataStream Systems',     industry: 'Data & AI',      revenue: 4.2, ebitda: 28.3, evRev: '3.8x', evEbitda: '13.1x', geo: 'North America', highlight: false },
  { id: 6, name: 'AppScale Solutions',     industry: 'SaaS',           revenue: 2.5, ebitda: 19.8, evRev: '2.9x', evEbitda: '10.2x', geo: 'Asia Pacific',  highlight: false },
  { id: 7, name: 'Enterprise Cloud Co.',   industry: 'Infrastructure', revenue: 5.1, ebitda: 31.2, evRev: '4.1x', evEbitda: '14.5x', geo: 'Europe',        highlight: false },
  { id: 8, name: 'SmartTech Analytics',    industry: 'Data & AI',      revenue: 2.9, ebitda: 25.4, evRev: '3.6x', evEbitda: '12.8x', geo: 'North America', highlight: false },
];

export default function ComparableAnalysis() {
  const [industry, setIndustry] = useState('all');
  const [geo, setGeo]           = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = companies.filter((c) => {
    if (industry !== 'all' && c.industry !== industry) return false;
    if (geo !== 'all' && c.geo !== geo) return false;
    return true;
  });

  const industries = ['all', 'SaaS', 'Infrastructure', 'Data & AI'];
  const geos       = ['all', 'North America', 'Europe', 'Asia Pacific'];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Comparables</Text>
            <Text style={s.subtitle}>Market multiples and benchmarks</Text>
          </View>
          <TouchableOpacity
            style={[s.filterBtn, showFilters && s.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={[s.filterBtnText, showFilters && s.filterBtnTextActive]}>Filter</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={s.filterPanel}>
            <Text style={s.filterGroupLabel}>Industry</Text>
            <View style={s.filterChips}>
              {industries.map((ind) => (
                <TouchableOpacity
                  key={ind}
                  style={[s.chip, industry === ind && s.chipActive]}
                  onPress={() => setIndustry(ind)}
                >
                  <Text style={[s.chipText, industry === ind && s.chipTextActive]}>
                    {ind === 'all' ? 'All' : ind}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.filterGroupLabel}>Geography</Text>
            <View style={s.filterChips}>
              {geos.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[s.chip, geo === g && s.chipActive]}
                  onPress={() => setGeo(g)}
                >
                  <Text style={[s.chipText, geo === g && s.chipTextActive]}>
                    {g === 'all' ? 'All' : g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Text style={s.resultCount}>{filtered.length} of {companies.length} companies</Text>

        {/* Table */}
        <View style={s.tableCard}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { flex: 2, textAlign: 'left' }]}>Company</Text>
            <Text style={s.th}>Rev</Text>
            <Text style={s.th}>EBITDA%</Text>
            <Text style={s.th}>EV/Rev</Text>
            <Text style={s.th}>EV/EBITDA</Text>
          </View>

          {filtered.map((c, i) => (
            <View
              key={c.id}
              style={[
                s.tableRow,
                i % 2 === 0 && s.tableRowAlt,
                c.highlight && s.tableRowHighlight,
              ]}
            >
              <View style={[{ flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                {c.highlight && <View style={s.highlightBar} />}
                <View>
                  <Text
                    style={[s.td, s.companyName, c.highlight && { color: '#3A6FF7', fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <Text style={s.industryTag}>{c.industry}</Text>
                </View>
              </View>
              <Text style={s.td}>${c.revenue}M</Text>
              <Text style={s.td}>{c.ebitda}%</Text>
              <Text style={[s.td, s.tdBold]}>{c.evRev}</Text>
              <Text style={[s.td, s.tdBold]}>{c.evEbitda}</Text>
            </View>
          ))}

          {/* Median row */}
          <View style={s.medianRow}>
            <View style={{ flex: 2 }}>
              <Text style={s.medianLabel}>Median</Text>
            </View>
            <Text style={s.td} />
            <Text style={s.td} />
            <Text style={[s.td, s.medianValue]}>3.4x</Text>
            <Text style={[s.td, s.medianValue]}>12.0x</Text>
          </View>
        </View>

        {/* Insights */}
        <View style={s.insightsCard}>
          <Text style={s.insightsTitle}>Market Insights</Text>
          {[
            'Acme Technologies trades at industry median multiples',
            'EBITDA margin is above peer average (+2.4pp)',
            'Revenue growth supports premium valuation potential',
          ].map((insight, i) => (
            <View key={i} style={s.insightRow}>
              <View style={s.insightDot} />
              <Text style={s.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: 20, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#0B1F3B', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#717182', marginTop: 2 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F1F2F4',
    borderRadius: 999, marginTop: 4,
  },
  filterBtnActive: { backgroundColor: '#3A6FF7' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#717182' },
  filterBtnTextActive: { color: '#fff' },
  filterPanel: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  filterGroupLabel: { fontSize: 11, fontWeight: '700', color: '#717182', letterSpacing: 0.5, marginBottom: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F7F8FA', borderRadius: 999 },
  chipActive: { backgroundColor: '#3A6FF7' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#717182' },
  chipTextActive: { color: '#fff' },
  resultCount: { fontSize: 13, color: '#717182', marginBottom: 12 },
  tableCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#F7F8FA',
    paddingVertical: 10, paddingHorizontal: 12,
  },
  th: { flex: 1, fontSize: 10, fontWeight: '700', color: '#717182', letterSpacing: 0.5, textAlign: 'right' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableRowHighlight: { backgroundColor: '#EFF6FF' },
  highlightBar: { width: 3, height: 32, backgroundColor: '#3A6FF7', borderRadius: 2, marginRight: 8 },
  td: { flex: 1, fontSize: 12, color: '#717182', textAlign: 'right' },
  tdBold: { fontWeight: '700', color: '#0B1F3B' },
  companyName: { fontSize: 13, color: '#0B1F3B', textAlign: 'left' },
  industryTag: { fontSize: 11, color: '#717182', marginTop: 1 },
  medianRow: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: '#F7F8FA', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  medianLabel: { fontSize: 12, fontWeight: '700', color: '#0B1F3B' },
  medianValue: { fontSize: 14, fontWeight: '800', color: '#0B1F3B' },
  insightsCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  insightsTitle: { fontSize: 16, fontWeight: '700', color: '#0B1F3B', marginBottom: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3A6FF7', marginTop: 5, marginRight: 10 },
  insightText: { flex: 1, fontSize: 13, color: '#717182', lineHeight: 18 },
});