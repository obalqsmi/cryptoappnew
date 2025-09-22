import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DeveloperConsole from '../../components/dev/DeveloperConsole';
import WalletManagerModal from '../../components/WalletManagerModal';
import Sheet from '../../components/Sheet';
import { useTranslation } from '../../services/i18n';
import { formatCurrency } from '../../services/formatting';
import { useAppStore } from '../../state/store';
import { usePortfolioValue } from '../../state/portfolioStore';
import { Currency } from '../../types/market';
import { version } from '../../package.json';

const themeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'OLED', value: 'oled' },
  { label: 'System', value: 'system' },
];

const currencyOptions: { label: string; value: Currency }[] = [
  { label: 'US Dollar', value: 'USD' },
  { label: 'Euro', value: 'EUR' },
  { label: 'UAE Dirham', value: 'AED' },
];

const faqItems = [
  { question: 'How do recurring swaps work?', answer: 'Recurring swaps execute automatically using your saved rules. You can pause them from the Trade tab.' },
  { question: 'How can I restore my wallet?', answer: 'Use the wallet manager to import a seed phrase or connect a watch-only address.' },
  { question: 'What is sandbox mode?', answer: 'Sandbox mode allows you to simulate trades without affecting your real balances.' },
];

const SettingsScreen = () => {
  const { t } = useTranslation();
  const portfolioValue = usePortfolioValue();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    currency,
    setCurrency,
    displayCurrencies,
    toggleDisplayCurrency,
    priceAlertsEnabled,
    togglePriceAlerts,
    biometricEnabled,
    setBiometricEnabled,
    setPasscode,
  } = useAppStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
    language: state.language,
    setLanguage: state.setLanguage,
    currency: state.currency,
    setCurrency: state.setCurrency,
    displayCurrencies: state.displayCurrencies,
    toggleDisplayCurrency: state.toggleDisplayCurrency,
    priceAlertsEnabled: state.priceAlertsEnabled,
    togglePriceAlerts: state.togglePriceAlerts,
    biometricEnabled: state.biometricEnabled,
    setBiometricEnabled: state.setBiometricEnabled,
    setPasscode: state.setPasscode,
  }));

  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [currencySheetVisible, setCurrencySheetVisible] = useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [developerVisible, setDeveloperVisible] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [faqExpanded, setFaqExpanded] = useState<string | null>(null);

  const savePasscode = async () => {
    if (newPasscode.length < 4 || newPasscode.length > 6) {
      return;
    }
    await setPasscode(newPasscode);
    setNewPasscode('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <Pressable onPress={() => setDeveloperVisible(true)}>
          <Ionicons name="terminal-outline" size={22} color="#60A5FA" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardLabel}>Active Wallet</Text>
              <Text style={styles.cardValue}>Balance</Text>
            </View>
            <Pressable style={styles.walletButton} onPress={() => setWalletModalVisible(true)}>
              <Text style={styles.walletButtonLabel}>Manage</Text>
            </Pressable>
          </View>
          <Text style={styles.cardBalance}>{formatCurrency(portfolioValue, currency)}</Text>
          <View style={styles.currencyRow}>
            {displayCurrencies.map((c) => (
              <View key={c} style={styles.currencyChip}>
                <Text style={styles.currencyChipLabel}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Pressable style={styles.settingRow} onPress={() => setThemeSheetVisible(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="color-palette-outline" size={20} color="#60A5FA" />
              <Text style={styles.settingLabel}>Theme</Text>
            </View>
            <Text style={styles.settingValue}>{theme.toUpperCase()}</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => setCurrencySheetVisible(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="cash-outline" size={20} color="#60A5FA" />
              <Text style={styles.settingLabel}>{t('currency')}</Text>
            </View>
            <Text style={styles.settingValue}>{currency}</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => setLanguageSheetVisible(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="language" size={20} color="#60A5FA" />
              <Text style={styles.settingLabel}>{t('language')}</Text>
            </View>
            <Text style={styles.settingValue}>{language.toUpperCase()}</Text>
          </Pressable>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="card" size={20} color="#60A5FA" />
              <Text style={styles.settingLabel}>Display Currencies</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyToggleRow}>
            {currencyOptions.map((option) => {
              const active = displayCurrencies.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  style={[styles.currencyToggle, active && styles.currencyToggleActive]}
                  onPress={() => toggleDisplayCurrency(option.value)}
                >
                  <Text style={[styles.currencyToggleLabel, active && styles.currencyToggleLabelActive]}>
                    {option.value}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('alerts')}</Text>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
              <Text style={styles.settingLabel}>Price Alerts</Text>
            </View>
            <Switch value={priceAlertsEnabled} onValueChange={togglePriceAlerts} trackColor={{ false: '#4B5563', true: '#2563EB' }} />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="finger-print-outline" size={20} color="#F59E0B" />
              <Text style={styles.settingLabel}>{t('biometricLock')}</Text>
            </View>
            <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: '#4B5563', true: '#2563EB' }} />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="keypad-outline" size={20} color="#F59E0B" />
              <Text style={styles.settingLabel}>{t('passcode')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={styles.passcodeInput}
                placeholder="••••"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={newPasscode}
                onChangeText={setNewPasscode}
                maxLength={6}
              />
              <Pressable style={styles.smallButton} onPress={savePasscode}>
                <Text style={styles.smallButtonLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>{version}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>1</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Open Source Packages</Text>
            <Text style={styles.aboutValue}>victory-native, expo-notifications, zustand</Text>
          </View>
          <Pressable style={styles.linkRow} onPress={() => Linking.openURL('https://github.com/expo/expo')}> 
            <Text style={styles.linkText}>Open Source Licenses</Text>
            <Ionicons name="open-outline" size={16} color="#60A5FA" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help')}</Text>
          {faqItems.map((item) => {
            const expanded = faqExpanded === item.question;
            return (
              <Pressable key={item.question} style={styles.faqItem} onPress={() => setFaqExpanded(expanded ? null : item.question)}>
                <View style={styles.rowLeft}>
                  <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={18} color="#60A5FA" />
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                </View>
                {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </Pressable>
            );
          })}
          <Pressable style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@cryptowallet.app')}>
            <Text style={styles.linkText}>Contact Support</Text>
            <Ionicons name="mail-outline" size={16} color="#60A5FA" />
          </Pressable>
        </View>

        <Text style={styles.footerText}>Build secure & polished • {version}</Text>
      </ScrollView>

      <Sheet isVisible={themeSheetVisible} onClose={() => setThemeSheetVisible(false)} title="Select Theme">
        {themeOptions.map((option) => (
          <Pressable key={option.value} style={styles.sheetItem} onPress={() => { setTheme(option.value as any); setThemeSheetVisible(false); }}>
            <Text style={styles.sheetLabel}>{option.label}</Text>
            {theme === option.value && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
          </Pressable>
        ))}
      </Sheet>
      <Sheet isVisible={currencySheetVisible} onClose={() => setCurrencySheetVisible(false)} title="Select Currency">
        {currencyOptions.map((option) => (
          <Pressable key={option.value} style={styles.sheetItem} onPress={() => { setCurrency(option.value); setCurrencySheetVisible(false); }}>
            <Text style={styles.sheetLabel}>{option.label}</Text>
            {currency === option.value && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
          </Pressable>
        ))}
      </Sheet>
      <Sheet isVisible={languageSheetVisible} onClose={() => setLanguageSheetVisible(false)} title="Select Language">
        {['en', 'ar'].map((code) => (
          <Pressable key={code} style={styles.sheetItem} onPress={() => { setLanguage(code as any); setLanguageSheetVisible(false); }}>
            <Text style={styles.sheetLabel}>{code === 'en' ? 'English' : 'العربية'}</Text>
            {language === code && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
          </Pressable>
        ))}
      </Sheet>

      <WalletManagerModal visible={walletModalVisible} onClose={() => setWalletModalVisible(false)} />
      <DeveloperConsole visible={developerVisible} onClose={() => setDeveloperVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111927',
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  cardValue: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardBalance: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  walletButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  walletButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  currencyChipLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111927',
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  settingValue: {
    color: '#9CA3AF',
  },
  currencyToggleRow: {
    gap: 10,
  },
  currencyToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1F2937',
  },
  currencyToggleActive: {
    backgroundColor: '#2563EB',
  },
  currencyToggleLabel: {
    color: '#9CA3AF',
  },
  currencyToggleLabelActive: {
    color: '#FFFFFF',
  },
  passcodeInput: {
    width: 80,
    borderRadius: 10,
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 6,
  },
  smallButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  aboutValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#60A5FA',
  },
  faqItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  faqQuestion: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  faqAnswer: {
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 18,
  },
  footerText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default SettingsScreen;

