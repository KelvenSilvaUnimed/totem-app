import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useCallback } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { IdleReset } from '@/components/idle-reset';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const handleIdle = useCallback(() => {
    router.replace({
      pathname: '/(tabs)',
      params: { idleReset: String(Date.now()) },
    } as any);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <IdleReset timeoutMs={35_000} onIdle={handleIdle}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </IdleReset>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
