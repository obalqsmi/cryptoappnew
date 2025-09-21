/**
 * -- INSTALL COMMANDS --
 * expo install react-native-svg
 * npm i zustand victory-native @react-native-async-storage/async-storage react-hook-form zod dayjs
 * expo install expo-haptics
 * expo install expo-font
 *
 * This is the root layout for the entire application. It sets up the main navigator,
 * providers (like safe area and theme), and loads necessary assets like fonts.
 * It ensures a consistent structure and appearance across all screens.
 */
import { useFonts } from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '../state/appStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': 'https://rsms.me/inter/font-files/Inter-Regular.otf?v=3.19',
    'Inter-SemiBold': 'https://rsms.me/inter/font-files/Inter-SemiBold.otf?v=3.19',
    'Inter-Bold': 'https://rsms.me/inter/font-files/Inter-Bold.otf?v=3.19',
  });
  const { theme } = useAppStore();
  const systemColorScheme = useColorScheme();
  const appTheme = theme === 'system' ? systemColorScheme : theme;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after fonts have loaded or an error occurred.
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Render nothing until the fonts are loaded and the app is ready.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: appTheme === 'dark' ? '#0B1220' : '#F6F8FC' }}>
      <Slot />
    </SafeAreaProvider>
  );
}
