/**
 * AsyncStorage Service: Provides a simple, typed interface for interacting with
 * React Native's AsyncStorage. It centralizes storage keys and logic for getting/setting
 * data, making it easier to manage persistent state like user holdings and settings.
 * Note: Zustand's persist middleware now handles this automatically, so this file is
 * kept for reference or for direct storage access if needed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency, Holding, Theme } from '../types/market';

const KEYS = {
  HOLDINGS: '@CryptoWallet/Holdings',
  CURRENCY: '@CryptoWallet/Currency',
  THEME: '@CryptoWallet/Theme',
};

// Holdings
export const getHoldings = async (): Promise<Holding[]> => {
  const jsonValue = await AsyncStorage.getItem(KEYS.HOLDINGS);
  return jsonValue != null ? JSON.parse(jsonValue) : [];
};

export const setHoldings = async (holdings: Holding[]): Promise<void> => {
  const jsonValue = JSON.stringify(holdings);
  await AsyncStorage.setItem(KEYS.HOLDINGS, jsonValue);
};

// Currency
export const getCurrency = async (): Promise<Currency> => {
  const value = await AsyncStorage.getItem(KEYS.CURRENCY);
  return (value as Currency) || 'USD';
};

export const setCurrency = async (currency: Currency): Promise<void> => {
  await AsyncStorage.setItem(KEYS.CURRENCY, currency);
};

// Theme
export const getTheme = async (): Promise<Theme> => {
  const value = await AsyncStorage.getItem(KEYS.THEME);
  return (value as Theme) || 'dark';
};

export const setTheme = async (theme: Theme): Promise<void> => {
  await AsyncStorage.setItem(KEYS.THEME, theme);
};
