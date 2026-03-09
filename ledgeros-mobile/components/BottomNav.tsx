import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  active: string;
  onNavigate: (tab: string) => void;
  userType: 'business' | 'investor';
}

const TABS = [
  { id: 'dashboard', label: 'Home' },
  { id: 'deals',     label: 'Deals' },
  { id: 'documents', label: 'Docs' },
  { id: 'insights',  label: 'Insights' },
];

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 16, height: 10, borderWidth: 2, borderColor: color, borderRadius: 2, marginTop: 4 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 9,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
        position: 'absolute', top: 0 }} />
    </View>
  );
}

function DealsIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View style={{ width: 16, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: 16, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: 10, height: 2.5, backgroundColor: color, borderRadius: 2, alignSelf: 'flex-start' }} />
    </View>
  );
}

function DocsIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 18, borderWidth: 2, borderColor: color, borderRadius: 2, position: 'relative' }}>
        <View style={{ position: 'absolute', top: 3, left: 2, width: 6, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ position: 'absolute', top: 7, left: 2, width: 8, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ position: 'absolute', top: 11, left: 2, width: 5, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function InsightsIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 12, height: 12, borderWidth: 2, borderColor: color, borderRadius: 6 }} />
      <View style={{ width: 2, height: 5, backgroundColor: color, borderRadius: 1, marginTop: -1 }} />
      <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 1, marginTop: 1 }} />
    </View>
  );
}

const ICONS = [HomeIcon, DealsIcon, DocsIcon, InsightsIcon];

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab, i) => {
        const isActive = active === tab.id;
        const Icon = ICONS[i];
        const color = isActive ? '#FFFFFF' : '#717182';
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onNavigate(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon color={color} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F2F4',
    paddingBottom: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: '#3A6FF7' },
  label: { fontSize: 11, fontWeight: '500', color: '#717182', marginTop: 2 },
  labelActive: { color: '#3A6FF7', fontWeight: '700' },
});