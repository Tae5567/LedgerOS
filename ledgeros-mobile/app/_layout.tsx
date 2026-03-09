import { Stack } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(business)" />
          <Stack.Screen name="(investor)" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}