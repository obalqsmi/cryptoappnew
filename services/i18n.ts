import { useMemo } from 'react';

import { useAppStore } from '../state/store';
import { Language } from '../types/app';

type TranslationDictionary = Record<string, { en: string; ar: string }>;

const dictionary: TranslationDictionary = {
  portfolio: { en: 'Portfolio', ar: 'المحفظة' },
  totalBalance: { en: 'Total Balance', ar: 'إجمالي الرصيد' },
  pnlDaily: { en: 'Daily', ar: 'يومي' },
  pnlWeekly: { en: 'Weekly', ar: 'أسبوعي' },
  pnlAllTime: { en: 'All Time', ar: 'مدى الحياة' },
  holdings: { en: 'Holdings', ar: 'المقتنيات' },
  watchlist: { en: 'Watchlist', ar: 'قائمة المراقبة' },
  sharePortfolio: { en: 'Share Portfolio', ar: 'مشاركة المحفظة' },
  aiAssistant: { en: 'AI Assistant', ar: 'مساعد ذكي' },
  sandboxMode: { en: 'Sandbox Mode', ar: 'وضع تجريبي' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  streak: { en: 'Daily Streak', ar: 'سلسلة يومية' },
  rewards: { en: 'Rewards', ar: 'المكافآت' },
  alerts: { en: 'Alerts', ar: 'التنبيهات' },
  trade: { en: 'Trade', ar: 'تداول' },
  history: { en: 'History', ar: 'السجل' },
  nfts: { en: 'NFTs', ar: 'رموز غير قابلة للاستبدال' },
  theme: { en: 'Theme', ar: 'السمة' },
  language: { en: 'Language', ar: 'اللغة' },
  currency: { en: 'Currency', ar: 'العملة' },
  biometricLock: { en: 'Biometric Lock', ar: 'قفل حيوي' },
  passcode: { en: 'Passcode', ar: 'رمز المرور' },
  manageWallets: { en: 'Manage Wallets', ar: 'إدارة المحافظ' },
  addWallet: { en: 'Add Wallet', ar: 'إضافة محفظة' },
  importWallet: { en: 'Import Wallet', ar: 'استيراد محفظة' },
  watchWallet: { en: 'Watch-only Wallet', ar: 'محفظة للمراقبة' },
  exportSeed: { en: 'Export Seed Phrase', ar: 'تصدير العبارة السرية' },
  help: { en: 'Help', ar: 'مساعدة' },
  about: { en: 'About', ar: 'حول' },
};

const translate = (key: string, language: Language) => dictionary[key]?.[language] ?? key;

export const useTranslation = () => {
  const language = useAppStore((state) => state.language);
  return useMemo(
    () => ({
      language,
      t: (key: string) => translate(key, language),
    }),
    [language]
  );
};

