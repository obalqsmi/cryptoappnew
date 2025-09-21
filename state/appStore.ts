/**
 * Zustand App Store: Manages global UI-related state.
 * This store handles settings like theme and currency, persisting them to
 * AsyncStorage. It's a lightweight global state solution that avoids prop drilling
 * for app-wide settings.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Currency, Theme } from '../types/market';

interface AppState {
  theme: Theme;
  currency: Currency;
  priceAlertsEnabled: boolean;
  biometricEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: Currency) => void;
  togglePriceAlerts: () => void;
  toggleBiometric: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      currency: 'USD',
      priceAlertsEnabled: true,
      biometricEnabled: false,
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      togglePriceAlerts: () =>
        set((state) => ({ priceAlertsEnabled: !state.priceAlertsEnabled })),
      toggleBiometric: () =>
        set((state) => ({ biometricEnabled: !state.biometricEnabled })),
    }),
    {
      name: 'crypto-wallet-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
