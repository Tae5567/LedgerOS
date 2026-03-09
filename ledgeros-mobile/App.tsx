import { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthScreen, { AuthUser } from './screens/AuthScreen';
import SMEDashboard from './screens/SMEDashboard';
import InvestorDashboard from './screens/InvestorDashboard';
import DocumentUpload from './screens/DocumentUpload';
import FinancialNormalization from './screens/FinancialNormalization';
import RiskSignals from './screens/RiskSignals';
import DealDetail from './screens/DealDetail';
import ComparableAnalysis from './screens/ComparableAnalysis';
import InsightsFeed from './screens/InsightsFeed';
import BottomNav from './components/BottomNav';

export type Screen =
  | 'auth'
  | 'sme-dashboard'
  | 'investor-dashboard'
  | 'document-upload'
  | 'financial-normalization'
  | 'risk-signals'
  | 'deal-detail'
  | 'comparable-analysis'
  | 'insights';

export default function App() {
  const [user, setUser]                     = useState<AuthUser | null>(null);
  const [currentScreen, setCurrentScreen]   = useState<Screen>('auth');
  const [activeTab, setActiveTab]           = useState<string>('dashboard');
  const [selectedDealId, setSelectedDealId] = useState<string>('biz-001');

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setCurrentScreen(loggedInUser.userType === 'business' ? 'sme-dashboard' : 'investor-dashboard');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
    setActiveTab('dashboard');
  };

  const handleTabNavigation = (tab: string) => {
    setActiveTab(tab);
    if (user?.userType === 'business') {
      const map: Record<string, Screen> = {
        dashboard: 'sme-dashboard',
        deals:     'financial-normalization',
        documents: 'document-upload',
        insights:  'insights',
      };
      setCurrentScreen(map[tab] ?? 'sme-dashboard');
    } else {
      const map: Record<string, Screen> = {
        dashboard: 'investor-dashboard',
        deals:     'comparable-analysis',
        documents: 'risk-signals',
        insights:  'insights',
      };
      setCurrentScreen(map[tab] ?? 'investor-dashboard');
    }
  };

  const handleSelectDeal = (companyId: string) => {
    setSelectedDealId(companyId);
    setCurrentScreen('deal-detail');
  };

  const renderScreen = () => {
    if (!user) return <AuthScreen onLogin={handleLogin} />;

    switch (currentScreen) {
      case 'sme-dashboard':
        return (
          <SMEDashboard
            user={user}
            onNavigateToUpload={() => { setCurrentScreen('document-upload'); setActiveTab('documents'); }}
            onLogout={handleLogout}
          />
        );
      case 'investor-dashboard':
        return (
          <InvestorDashboard
            user={user}
            onSelectDeal={handleSelectDeal}
            onLogout={handleLogout}
          />
        );
      case 'document-upload':
        return <DocumentUpload user={user} />;
      case 'financial-normalization':
        return <FinancialNormalization user={user} />;
      case 'risk-signals':
        return <RiskSignals dealId={selectedDealId} />;
      case 'deal-detail':
        return (
          <DealDetail
            companyId={selectedDealId}
            onBack={() => { setCurrentScreen('investor-dashboard'); setActiveTab('dashboard'); }}
          />
        );
      case 'comparable-analysis':
        return <ComparableAnalysis />;
      case 'insights':
        return <InsightsFeed user={user} />;
      default:
        return <AuthScreen onLogin={handleLogin} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
      <View style={styles.container}>
        {renderScreen()}
        {user !== null && currentScreen !== 'deal-detail' && (
          <BottomNav
            active={activeTab}
            onNavigate={handleTabNavigation}
            userType={user.userType}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
});