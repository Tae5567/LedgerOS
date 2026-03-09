import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onSelectUserType: (type: 'business' | 'investor') => void;
}

export default function WelcomeScreen({ onSelectUserType }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.logoSection}>
          <View style={s.logoBox}>
            <View style={s.logoInner}>
              <View style={s.logoBar1} />
              <View style={s.logoBar2} />
              <View style={s.logoBar3} />
            </View>
          </View>
          <Text style={s.appName}>LedgerOS</Text>
          <Text style={s.tagline}>Private Markets Underwriting</Text>
        </View>

        <View style={s.headlineSection}>
          <Text style={s.headline}>Automated Underwriting for Private Market Deals</Text>
          <Text style={s.subheadline}>
            Upload financial documents. Generate structured investment analysis in minutes.
          </Text>
        </View>

        <View style={s.flowCard}>
          <View style={s.flowStep}>
            <View style={[s.flowIcon, { backgroundColor: '#3A6FF7' }]}>
              <View style={s.docIcon}>
                <View style={s.docLine} />
                <View style={[s.docLine, { width: 14 }]} />
                <View style={[s.docLine, { width: 10 }]} />
              </View>
            </View>
            <Text style={s.flowLabel}>Upload</Text>
          </View>
          <View style={s.flowArrow} />
          <View style={s.flowStep}>
            <View style={[s.flowIcon, { backgroundColor: '#3A6FF7' }]}>
              <View style={s.buildingIcon}>
                <View style={s.buildingTop} />
                <View style={s.buildingBody} />
              </View>
            </View>
            <Text style={s.flowLabel}>Analyze</Text>
          </View>
          <View style={s.flowArrow} />
          <View style={s.flowStep}>
            <View style={[s.flowIcon, { backgroundColor: '#22A06B' }]}>
              <View style={s.trendIcon}>
                <View style={s.trendLine} />
              </View>
            </View>
            <Text style={s.flowLabel}>Report</Text>
          </View>
        </View>

        <View style={s.buttons}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => onSelectUserType('business')}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>Continue as Business</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => onSelectUserType('investor')}
            activeOpacity={0.85}
          >
            <Text style={s.secondaryBtnText}>Continue as Investor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 80, height: 80, backgroundColor: '#3A6FF7', borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#3A6FF7', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  logoInner: { alignItems: 'flex-end', gap: 5 },
  logoBar1: { width: 28, height: 4, backgroundColor: '#fff', borderRadius: 2 },
  logoBar2: { width: 20, height: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 },
  logoBar3: { width: 12, height: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 },
  appName: { fontSize: 38, fontWeight: '800', color: '#0B1F3B', letterSpacing: -1 },
  tagline: { fontSize: 14, color: '#717182', marginTop: 4, fontWeight: '500' },
  headlineSection: { alignItems: 'center', marginBottom: 36 },
  headline: { fontSize: 22, fontWeight: '700', color: '#0B1F3B', textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  subheadline: { fontSize: 15, color: '#717182', textAlign: 'center', lineHeight: 22 },
  flowCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  flowStep: { alignItems: 'center' },
  flowIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  flowLabel: { fontSize: 12, fontWeight: '600', color: '#717182' },
  flowArrow: { flex: 1, height: 2, backgroundColor: '#3A6FF7', marginHorizontal: 8, marginBottom: 20, borderRadius: 2 },
  docIcon: { gap: 4 },
  docLine: { width: 18, height: 2.5, backgroundColor: '#fff', borderRadius: 1 },
  buildingIcon: { alignItems: 'center' },
  buildingTop: { width: 20, height: 6, backgroundColor: '#fff', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  buildingBody: { width: 24, height: 12, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 },
  trendIcon: { width: 28, height: 16 },
  trendLine: {
    position: 'absolute', bottom: 0, left: 0,
    width: 28, height: 2, backgroundColor: '#fff', borderRadius: 1,
    transform: [{ rotate: '-20deg' }],
  },
  buttons: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#0B1F3B', height: 56, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0B1F3B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#fff', height: 56, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0B1F3B',
  },
  secondaryBtnText: { color: '#0B1F3B', fontSize: 16, fontWeight: '700' },
});