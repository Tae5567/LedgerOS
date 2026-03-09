// screens/AuthScreen.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, LoggedInUser } from '../store/authStore';

interface Props { onLogin: (user: LoggedInUser) => void; }

const TEST_ACCOUNTS = [
  { label: 'Tunde — Acme (Business)',      email: 'acme@ledgeros.com',       password: 'demo1234',  color: '#8B5CF6' },
  { label: 'Sarah — BrightPath (Business)',email: 'brightpath@ledgeros.com', password: 'demo1234',  color: '#3A6FF7' },
  { label: 'James — Meridian (Investor)',  email: 'investor@ledgeros.com',   password: 'invest123', color: '#0D9488' },
  { label: 'Amara — Lagos Fund (Investor)',email: 'fund@ledgeros.com',        password: 'invest123', color: '#22A06B' },
];

export default function AuthScreen({ onLogin }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showCreds, setShowCreds] = useState(false);
  const { login, loading, error } = useAuthStore();

  const handleLogin = async (e = email, p = password) => {
    if (!e || !p) { Alert.alert('Required', 'Enter your email and password.'); return; }
    try {
      const user = await login(e.trim().toLowerCase(), p);
      onLogin(user);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoSection}>
          <View style={s.logoBox}>
            <View style={s.logoInner}>
              <View style={s.bar1} /><View style={s.bar2} /><View style={s.bar3} />
            </View>
          </View>
          <Text style={s.appName}>LedgerOS</Text>
          <Text style={s.tagline}>Private Markets Underwriting</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@ledgeros.com" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address" />
          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry />
          {error ? <Text style={s.errorText}>{error}</Text> : null}
          <TouchableOpacity style={[s.loginBtn, loading && s.btnDisabled]} onPress={() => handleLogin()} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginBtnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowCreds(!showCreds)} style={s.toggle}>
          <Text style={s.toggleText}>{showCreds ? 'Hide test accounts' : 'Show test accounts'}</Text>
        </TouchableOpacity>

        {showCreds && (
          <View style={s.credsCard}>
            <Text style={s.credsTitle}>Test Accounts</Text>
            {TEST_ACCOUNTS.map((a) => (
              <TouchableOpacity key={a.email} style={s.credRow} onPress={() => handleLogin(a.email, a.password)} activeOpacity={0.75}>
                <View style={[s.avatar, { backgroundColor: a.color }]}>
                  <Text style={s.avatarText}>{a.label.slice(0,2).toUpperCase()}</Text>
                </View>
                <View style={s.credInfo}>
                  <Text style={s.credName}>{a.label}</Text>
                  <Text style={s.credEmail}>{a.email}</Text>
                </View>
                <Text style={s.tapText}>Tap →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', paddingTop: 20, marginBottom: 36 },
  logoBox: { width: 72, height: 72, backgroundColor: '#3A6FF7', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#3A6FF7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  logoInner: { alignItems: 'flex-end', gap: 5 },
  bar1: { width: 26, height: 3.5, backgroundColor: '#fff', borderRadius: 2 },
  bar2: { width: 18, height: 3.5, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 },
  bar3: { width: 11, height: 3.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 },
  appName: { fontSize: 32, fontWeight: '800', color: '#0B1F3B', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#717182', marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#0B1F3B', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#0B1F3B', marginBottom: 6 },
  input: { backgroundColor: '#F7F8FA', borderRadius: 12, height: 48, paddingHorizontal: 14, fontSize: 15, color: '#0B1F3B', marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  errorText: { fontSize: 13, color: '#EF4444', marginBottom: 10 },
  loginBtn: { backgroundColor: '#0B1F3B', height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { alignItems: 'center', paddingVertical: 10 },
  toggleText: { fontSize: 14, color: '#3A6FF7', fontWeight: '600' },
  credsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  credsTitle: { fontSize: 16, fontWeight: '800', color: '#0B1F3B', marginBottom: 16 },
  credRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F7F8FA' },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  credInfo: { flex: 1 },
  credName: { fontSize: 13, fontWeight: '600', color: '#0B1F3B' },
  credEmail: { fontSize: 11, color: '#717182', marginTop: 1 },
  tapText: { fontSize: 12, fontWeight: '700', color: '#3A6FF7' },
});