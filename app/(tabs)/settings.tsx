/**
 * Settings Screen: Provides user-configurable options for the app.
 * Users can manage their wallet, change appearance (theme), select their
 * preferred currency, and access informational pages like 'About' and 'Help'.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Appearance, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { version } from '../../package.json';

import Sheet from '../../components/Sheet';
import { formatCurrency } from '../../services/formatting';
import { useAppStore } from '../../state/appStore';
import { usePortfolioValue } from '../../state/portfolioStore';
import { Currency, Theme } from '../../types/market';

export default function SettingsScreen() {
  const {
    theme,
    setTheme,
    currency,
    setCurrency,
    priceAlertsEnabled,
    togglePriceAlerts,
    biometricEnabled,
    toggleBiometric,
  } = useAppStore();
  
  const portfolioValue = usePortfolioValue();
  const [currencySheetVisible, setCurrencySheetVisible] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  
  const colorScheme = theme === 'system' ? Appearance.getColorScheme() : theme;
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  const SettingRow = ({
    label,
    icon,
    children,
    onPress
  }: {
    label: string;
    icon: any;
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={22} color={styles.rowLabel.color} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {children}
    </Pressable>
  );

  const THEMES: { label: string, value: Theme }[] = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
    { label: 'System', value: 'system' },
  ];
  const CURRENCIES: { label: string, value: Currency }[] = [
      { label: 'US Dollar', value: 'USD' },
      { label: 'Euro', value: 'EUR' },
      { label: 'UAE Dirham', value: 'AED' }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.walletLabel}>Current Wallet</Text>
          <Text style={styles.walletAddress}>0x1a2b...c3d4e</Text>
          <Text style={styles.walletValue}>{formatCurrency(portfolioValue, currency)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingRow label="Appearance" icon="color-palette-outline" onPress={() => setThemeSheetVisible(true)}>
             <Text style={styles.rowValue}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</Text>
          </SettingRow>
           <SettingRow label="Currency" icon="cash-outline" onPress={() => setCurrencySheetVisible(true)}>
             <Text style={styles.rowValue}>{currency}</Text>
          </SettingRow>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingRow label="Price Alerts" icon="notifications-outline">
            <Switch value={priceAlertsEnabled} onValueChange={togglePriceAlerts} trackColor={{false: '#767577', true: '#2F80ED'}}/>
          </SettingRow>
          <SettingRow label="Biometric Lock" icon="finger-print-outline">
            <Switch value={biometricEnabled} onValueChange={toggleBiometric} trackColor={{false: '#767577', true: '#2F80ED'}}/>
          </SettingRow>
        </View>

         <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingRow label="About" icon="information-circle-outline">
             <Ionicons name="chevron-forward" size={20} color="#6B768A" />
          </SettingRow>
          <SettingRow label="Help" icon="help-buoy-outline">
             <Ionicons name="chevron-forward" size={20} color="#6B768A" />
          </SettingRow>
        </View>
        
        <Text style={styles.footerText}>Version {version}</Text>
      </ScrollView>

      <Sheet isVisible={themeSheetVisible} onClose={() => setThemeSheetVisible(false)} title="Select Theme">
        {THEMES.map(t => (
            <Pressable key={t.value} style={styles.sheetItem} onPress={() => { setTheme(t.value); setThemeSheetVisible(false); }}>
                <Text style={styles.sheetItemText}>{t.label}</Text>
                {theme === t.value && <Ionicons name="checkmark-circle" size={24} color="#2F80ED"/>}
            </Pressable>
        ))}
      </Sheet>
      <Sheet isVisible={currencySheetVisible} onClose={() => setCurrencySheetVisible(false)} title="Select Currency">
        {CURRENCIES.map(c => (
            <Pressable key={c.value} style={styles.sheetItem} onPress={() => { setCurrency(c.value); setCurrencySheetVisible(false); }}>
                <Text style={styles.sheetItemText}>{c.label} ({c.value})</Text>
                {currency === c.value && <Ionicons name="checkmark-circle" size={24} color="#2F80ED"/>}
            </Pressable>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#0B1220' : '#F6F8FC' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: isDarkMode ? '#FFFFFF' : '#0B1220', fontSize: 24, fontWeight: 'bold' },
  scrollContent: { padding: 16, gap: 24 },
  card: { 
    backgroundColor: isDarkMode ? '#111927' : '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
  },
  walletLabel: { color: isDarkMode ? '#6B768A' : '#687385' },
  walletAddress: { color: isDarkMode ? '#E6ECF5' : '#0B1220', fontWeight: '600', fontSize: 16, marginTop: 4 },
  walletValue: { color: isDarkMode ? '#FFFFFF' : '#0B1220', fontWeight: 'bold', fontSize: 22, marginTop: 8 },
  section: { 
    backgroundColor: isDarkMode ? '#111927' : '#FFFFFF', 
    borderRadius: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
  },
  sectionTitle: { 
    color: isDarkMode ? '#E6ECF5' : '#0B1220', 
    fontWeight: 'bold', 
    fontSize: 18, 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowLabel: { color: isDarkMode ? '#E6ECF5' : '#0B1220', fontWeight: '600', fontSize: 16 },
  rowValue: { color: isDarkMode ? '#6B768A' : '#687385' },
  footerText: { color: isDarkMode ? '#6B768A' : '#687385', textAlign: 'center', marginTop: 16 },
  sheetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A2333' },
  sheetItemText: { color: '#FFF', fontSize: 16 },
});

