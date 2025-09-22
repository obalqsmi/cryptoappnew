/**
 * Root Layout for the entire application.
 * Handles global providers, biometric gatekeeping, theme selection, notification permissions,
 * and deep linking so the experience matches production-grade expectations.
 */
import { useFonts } from 'expo-font';
import * as LinkingExpo from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Slot, SplashScreen, useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Linking, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SecurityGate from '../components/security/SecurityGate';
import { startMarketPolling, fetchNews } from '../services/prices';
import { useAppStore } from '../state/store';
import { Currency } from '../types/market';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const SCHEME = 'cryptowallet';

const getThemeBackground = (theme: string | null | undefined) => {
  switch (theme) {
    case 'light':
      return '#F6F8FC';
    case 'oled':
      return '#000000';
    default:
      return '#0B1220';
  }
};

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': 'https://rsms.me/inter/font-files/Inter-Regular.otf?v=3.19',
    'Inter-SemiBold': 'https://rsms.me/inter/font-files/Inter-SemiBold.otf?v=3.19',
    'Inter-Bold': 'https://rsms.me/inter/font-files/Inter-Bold.otf?v=3.19',
  });

  const { theme, currency, recordLogin } = useAppStore((state) => ({
    theme: state.theme,
    currency: state.currency,
    recordLogin: state.recordLogin,
  }));

  const systemColorScheme = useColorScheme();
  const appliedTheme = theme === 'system' ? systemColorScheme : theme;
  const backgroundColor = getThemeBackground(appliedTheme);

  const handleDeepLink = useCallback(
    (url?: string | null) => {
      if (!url) return;
      const parsed = LinkingExpo.parse(url);
      if (parsed.scheme !== SCHEME) return;
      if (parsed.path?.startsWith('coin/')) {
        const [, symbol] = parsed.path.split('/');
        router.push({ pathname: '/(tabs)/market', params: { focus: symbol } });
      }
    },
    [router]
  );

  useEffect(() => {
    recordLogin();
  }, [recordLogin]);

  useEffect(() => {
    const requestPermissions = async () => {
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        await Notifications.requestPermissionsAsync();
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then(handleDeepLink).catch(() => null);
    return () => subscription.remove();
  }, [handleDeepLink]);

  useEffect(() => {
    startMarketPolling(currency as Currency);
    fetchNews();
    return () => {
      // polling cleanup handled elsewhere when currency changes
    };
  }, [currency]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor }}>
      <StatusBar
        barStyle={appliedTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={backgroundColor}
      />
      <SecurityGate>
        <Slot />
      </SecurityGate>
    </SafeAreaProvider>
  );
}

