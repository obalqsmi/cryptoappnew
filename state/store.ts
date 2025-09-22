import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { notifyAlert } from '../services/notifications';
import { Activity, Holding, Quote, Token, Currency } from '../types/market';
import {
  Achievement,
  AchievementId,
  AutoSwapRule,
  BenchmarkPoint,
  DevSettingsState,
  GamificationState,
  Language,
  LeaderboardEntry,
  MarketSliceState,
  NewsArticle,
  PortfolioAlert,
  PriceAlert,
  SecurityState,
  ThemeOption,
  TransactionSpeed,
  Wallet,
  WalletMetadata,
  WalletType,
} from '../types/app';

const hashPasscode = async (passcode: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, passcode);

const generateSeedPhrase = () => {
  const words = [
    'galaxy',
    'lunar',
    'nebula',
    'orbit',
    'stellar',
    'quantum',
    'spectrum',
    'zenith',
    'crypto',
    'matrix',
    'nova',
    'aurora',
    'cipher',
    'ember',
    'fusion',
    'glimmer',
    'harbor',
    'isotope',
    'kinetic',
    'lattice',
    'meteor',
    'nylon',
    'omega',
    'prism',
  ];

  return Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
};

const now = () => new Date().toISOString();

const defaultHoldings: Holding[] = [
  { id: 'bitcoin', symbol: 'BTC', amount: 0.65 },
  { id: 'ethereum', symbol: 'ETH', amount: 4.2 },
  { id: 'solana', symbol: 'SOL', amount: 120 },
  { id: 'dogecoin', symbol: 'DOGE', amount: 20000 },
  { id: 'ripple', symbol: 'XRP', amount: 2600 },
];

const seedWallet = (overrides: Partial<Wallet>): Wallet => ({
  id: `wallet_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  name: 'Main Wallet',
  type: 'standard',
  seedPhrase: generateSeedPhrase(),
  createdAt: now(),
  holdings: defaultHoldings,
  activities: [
    {
      id: 'seed-swap-1',
      date: dayjs().subtract(2, 'day').toISOString(),
      type: 'swap',
      from: { id: 'ethereum', symbol: 'ETH', amount: 0.5, valueUsd: 1800 },
      to: { id: 'solana', symbol: 'SOL', amount: 20, valueUsd: 1800 },
    },
  ],
  autoSwapRules: [
    {
      id: 'autoswap-weekly-eth',
      fromAsset: 'ethereum',
      toAsset: 'bitcoin',
      amount: 0.05,
      frequency: 'weekly',
      dayOfWeek: 1,
      enabled: true,
      nextRun: dayjs().add(3, 'day').toISOString(),
    },
  ],
  favoritePairs: ['ETH/BTC', 'SOL/USDT'],
  achievements: ['first_swap'],
  sandboxBalance: 100000,
  ...overrides,
});

const createWatchWallet = (): Wallet => ({
  id: `watch_${Date.now()}`,
  name: 'Ledger Watch',
  type: 'watch',
  address: '0xDEADBEEF1234567890',
  createdAt: now(),
  watchAssets: ['bitcoin', 'ethereum', 'solana'],
  holdings: [
    { id: 'bitcoin', symbol: 'BTC', amount: 1.1 },
    { id: 'ethereum', symbol: 'ETH', amount: 12 },
  ],
  activities: [],
  autoSwapRules: [],
  favoritePairs: [],
  achievements: ['watch_wallet_added'],
});

const createSimulationWallet = (): Wallet => ({
  id: `sim_${Date.now()}`,
  name: 'Simulation $100k',
  type: 'simulation',
  createdAt: now(),
  holdings: [
    { id: 'bitcoin', symbol: 'BTC', amount: 0.8 },
    { id: 'ethereum', symbol: 'ETH', amount: 6 },
  ],
  activities: [],
  autoSwapRules: [],
  favoritePairs: ['BTC/ETH'],
  achievements: ['sandbox_enabled'],
  sandboxBalance: 100000,
  seedPhrase: generateSeedPhrase(),
});

const defaultAchievements: Achievement[] = [
  {
    id: 'first_swap',
    title: 'First Swap Complete',
    description: 'Execute your first swap to unlock this achievement.',
    earnedAt: dayjs().subtract(5, 'day').toISOString(),
  },
];

interface AppSlice {
  theme: ThemeOption;
  currency: Currency;
  language: Language;
  displayCurrencies: Currency[];
  setTheme: (theme: ThemeOption) => void;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  toggleDisplayCurrency: (currency: Currency) => void;
  priceAlertsEnabled: boolean;
  togglePriceAlerts: () => void;
}

interface SecuritySlice extends SecurityState {
  setBiometricEnabled: (enabled: boolean) => void;
  setPasscode: (passcode: string) => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
  requireLock: () => void;
}

interface WalletSlice {
  wallets: Wallet[];
  activeWalletId: string;
  quotes: Record<string, Quote>;
  tokens: Token[];
  switchWallet: (id: string) => void;
  addWallet: (name: string) => Wallet;
  importWallet: (seedPhrase: string, name?: string) => Wallet;
  exportSeedPhrase: (id: string) => string | undefined;
  addWatchWallet: (address: string, name?: string) => Wallet;
  addActivity: (walletId: string, activity: Omit<Activity, 'id' | 'date'>) => Activity;
  recordSwap: (
    walletId: string,
    from: { id: string; symbol: string; amount: number },
    to: { id: string; symbol: string; amount: number }
  ) => Activity | undefined;
  setQuotes: (quotes: Record<string, Quote>) => void;
  setTokens: (tokens: Token[]) => void;
  updateHoldings: (walletId: string, holdings: Holding[]) => void;
  toggleFavoritePair: (pair: string) => void;
  upsertAutoSwapRule: (walletId: string, rule: AutoSwapRule) => void;
  toggleAutoSwapRule: (walletId: string, ruleId: string) => void;
}

interface MarketSlice extends MarketSliceState {
  setBenchmarks: (points: BenchmarkPoint[]) => void;
  setNews: (articles: NewsArticle[]) => void;
  setTokensLoading: (value: boolean) => void;
  setTokensError: (message?: string) => void;
}

interface AlertSlice {
  priceAlerts: PriceAlert[];
  portfolioAlerts: PortfolioAlert[];
  newsAlerts: NewsArticle[];
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'triggeredAt'>) => PriceAlert;
  updatePriceAlert: (id: string, alert: Partial<PriceAlert>) => void;
  removePriceAlert: (id: string) => void;
  addPortfolioAlert: (alert: Omit<PortfolioAlert, 'id' | 'triggeredAt'>) => PortfolioAlert;
  updatePortfolioAlert: (id: string, alert: Partial<PortfolioAlert>) => void;
  removePortfolioAlert: (id: string) => void;
  evaluateAlerts: (wallet: Wallet, totalValue: number) => void;
}

interface DevSlice extends DevSettingsState {
  setTransactionSpeed: (speed: TransactionSpeed) => void;
  toggleSandboxMode: () => void;
  appendDebugLog: (message: string) => void;
  clearStorage: () => Promise<void>;
}

interface GamificationSlice extends GamificationState {
  recordLogin: () => void;
  grantAchievement: (achievement: Achievement) => void;
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
}

export type AppStoreState = AppSlice &
  SecuritySlice &
  WalletSlice &
  MarketSlice &
  AlertSlice &
  DevSlice &
  GamificationSlice;

const createAppSlice = (set: any): AppSlice => ({
  theme: 'dark',
  currency: 'USD',
  language: 'en',
  displayCurrencies: ['USD', 'EUR', 'AED'],
  setTheme: (theme) => set({ theme }),
  setCurrency: (currency) => set({ currency }),
  setLanguage: (language) => set({ language }),
  toggleDisplayCurrency: (currency) =>
    set((state: AppStoreState) => {
      const exists = state.displayCurrencies.includes(currency);
      const displayCurrencies = exists
        ? state.displayCurrencies.filter((c) => c !== currency)
        : [...state.displayCurrencies, currency];
      return { displayCurrencies };
    }),
  priceAlertsEnabled: true,
  togglePriceAlerts: () => set((state: AppStoreState) => ({ priceAlertsEnabled: !state.priceAlertsEnabled })),
});

const createSecuritySlice = (set: any, get: () => AppStoreState): SecuritySlice => ({
  biometricEnabled: true,
  passcode: undefined,
  locked: true,
  lockOnBackground: true,
  setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
  setPasscode: async (passcode: string) => {
    const hashed = await hashPasscode(passcode);
    set({ passcode: hashed });
  },
  verifyPasscode: async (passcode: string) => {
    if (!get().passcode) {
      return true;
    }
    const hashed = await hashPasscode(passcode);
    const isValid = hashed === get().passcode;
    if (isValid) {
      set({ locked: false });
    }
    return isValid;
  },
  unlock: () => set({ locked: false }),
  lock: () => set({ locked: true }),
  requireLock: () => {
    const { biometricEnabled, passcode } = get();
    if (biometricEnabled || passcode) {
      set({ locked: true });
    }
  },
});

const createWalletSlice = (set: any, get: () => AppStoreState): WalletSlice => ({
  wallets: [seedWallet({}), createWatchWallet(), createSimulationWallet()],
  activeWalletId: '',
  quotes: {},
  tokens: [],
  switchWallet: (id) => set({ activeWalletId: id }),
  addWallet: (name) => {
    const wallet = seedWallet({ name });
    set((state: AppStoreState) => ({ wallets: [wallet, ...state.wallets], activeWalletId: wallet.id }));
    return wallet;
  },
  importWallet: (seedPhrase, name) => {
    const wallet: Wallet = {
      ...seedWallet({ name: name || 'Imported Wallet' }),
      id: `import_${Date.now()}`,
      seedPhrase,
      achievements: ['first_swap'],
    };
    set((state: AppStoreState) => ({ wallets: [wallet, ...state.wallets], activeWalletId: wallet.id }));
    return wallet;
  },
  exportSeedPhrase: (id) => get().wallets.find((w) => w.id === id)?.seedPhrase,
  addWatchWallet: (address, name) => {
    const wallet = {
      ...createWatchWallet(),
      id: `watch_${Date.now()}`,
      name: name || 'Watch Wallet',
      address,
    };
    set((state: AppStoreState) => ({ wallets: [wallet, ...state.wallets] }));
    return wallet;
  },
  addActivity: (walletId, activity) => {
    const newActivity: Activity = {
      ...activity,
      id: `act_${Date.now()}`,
      date: new Date().toISOString(),
    } as Activity;
    set((state: AppStoreState) => ({
      wallets: state.wallets.map((wallet) =>
        wallet.id === walletId
          ? { ...wallet, activities: [newActivity, ...wallet.activities] }
          : wallet
      ),
    }));
    return newActivity;
  },
  recordSwap: (walletId, from, to) => {
    const { quotes } = get();
    const fromValue = (quotes[from.id]?.current_price ?? 0) * from.amount;
    const swapActivity: Activity = {
      id: `swap_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'swap',
      from: { ...from, valueUsd: fromValue },
      to: { ...to, valueUsd: fromValue },
    };

    set((state: AppStoreState) => ({
      wallets: state.wallets.map((wallet) => {
        if (wallet.id !== walletId) return wallet;
        const holdings = wallet.holdings.map((holding) =>
          holding.id === from.id
            ? { ...holding, amount: Math.max(holding.amount - from.amount, 0) }
            : holding
        );
        const toIndex = holdings.findIndex((h) => h.id === to.id);
        if (toIndex >= 0) {
          holdings[toIndex] = { ...holdings[toIndex], amount: holdings[toIndex].amount + to.amount };
        } else {
          holdings.push({ id: to.id, symbol: to.symbol, amount: to.amount });
        }
        return {
          ...wallet,
          holdings,
          activities: [swapActivity, ...wallet.activities],
        };
      }),
    }));

    return swapActivity;
  },
  setQuotes: (quotes) => set({ quotes }),
  setTokens: (tokens) => set({ tokens }),
  updateHoldings: (walletId, holdings) =>
    set((state: AppStoreState) => ({
      wallets: state.wallets.map((wallet) => (wallet.id === walletId ? { ...wallet, holdings } : wallet)),
    })),
  toggleFavoritePair: (pair) =>
    set((state: AppStoreState) => ({
      wallets: state.wallets.map((wallet) =>
        wallet.id === state.activeWalletId
          ? {
              ...wallet,
              favoritePairs: wallet.favoritePairs.includes(pair)
                ? wallet.favoritePairs.filter((p) => p !== pair)
                : [...wallet.favoritePairs, pair],
            }
          : wallet
      ),
    })),
  upsertAutoSwapRule: (walletId, rule) =>
    set((state: AppStoreState) => ({
      wallets: state.wallets.map((wallet) =>
        wallet.id === walletId
          ? {
              ...wallet,
              autoSwapRules: wallet.autoSwapRules.some((r) => r.id === rule.id)
                ? wallet.autoSwapRules.map((r) => (r.id === rule.id ? rule : r))
                : [...wallet.autoSwapRules, rule],
            }
          : wallet
      ),
    })),
  toggleAutoSwapRule: (walletId, ruleId) =>
    set((state: AppStoreState) => ({
      wallets: state.wallets.map((wallet) =>
        wallet.id === walletId
          ? {
              ...wallet,
              autoSwapRules: wallet.autoSwapRules.map((rule) =>
                rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
              ),
            }
          : wallet
      ),
    })),
});

const createMarketSlice = (set: any): MarketSlice => ({
  tokensLoading: false,
  tokensError: undefined,
  benchmarks: [],
  news: [],
  setBenchmarks: (points) => set({ benchmarks: points }),
  setNews: (articles) => set({ news: articles }),
  setTokensLoading: (value) => set({ tokensLoading: value }),
  setTokensError: (message) => set({ tokensError: message }),
});

const createAlertSlice = (set: any, get: () => AppStoreState): AlertSlice => ({
  priceAlerts: [
    {
      id: 'alert_btc_breakout',
      assetId: 'bitcoin',
      assetSymbol: 'BTC',
      condition: { direction: 'above', targetPrice: 75000 },
      repeating: false,
    },
  ],
  portfolioAlerts: [
    {
      id: 'portfolio_drawdown',
      thresholdPercent: 5,
      direction: 'down',
      repeating: true,
    },
  ],
  newsAlerts: [],
  addPriceAlert: (alert) => {
    const created: PriceAlert = { ...alert, id: `pa_${Date.now()}` };
    set((state: AppStoreState) => ({ priceAlerts: [created, ...state.priceAlerts] }));
    return created;
  },
  updatePriceAlert: (id, alert) =>
    set((state: AppStoreState) => ({
      priceAlerts: state.priceAlerts.map((pa) => (pa.id === id ? { ...pa, ...alert } : pa)),
    })),
  removePriceAlert: (id) =>
    set((state: AppStoreState) => ({ priceAlerts: state.priceAlerts.filter((pa) => pa.id !== id) })),
  addPortfolioAlert: (alert) => {
    const created: PortfolioAlert = { ...alert, id: `pla_${Date.now()}` };
    set((state: AppStoreState) => ({ portfolioAlerts: [created, ...state.portfolioAlerts] }));
    return created;
  },
  updatePortfolioAlert: (id, alert) =>
    set((state: AppStoreState) => ({
      portfolioAlerts: state.portfolioAlerts.map((pa) => (pa.id === id ? { ...pa, ...alert } : pa)),
    })),
  removePortfolioAlert: (id) =>
    set((state: AppStoreState) => ({ portfolioAlerts: state.portfolioAlerts.filter((pa) => pa.id !== id) })),
  evaluateAlerts: (wallet, totalValue) => {
    const { priceAlerts, portfolioAlerts, quotes, priceAlertsEnabled } = get();
    if (!priceAlertsEnabled) {
      return;
    }
    const triggered: string[] = [];

    priceAlerts.forEach((alert) => {
      const price = quotes[alert.assetId]?.current_price;
      if (!price) return;
      const { targetPrice, percentChange, direction } = alert.condition;
      let shouldTrigger = false;
      if (targetPrice) {
        shouldTrigger = direction === 'above' ? price >= targetPrice : price <= targetPrice;
      }
      if (!shouldTrigger && percentChange != null) {
        const base = quotes[alert.assetId]?.price_change_percentage_24h ?? 0;
        shouldTrigger =
          direction === 'above' ? base >= percentChange : Math.abs(base) >= percentChange;
      }
      if (shouldTrigger && (!alert.triggeredAt || alert.repeating)) {
        triggered.push(alert.assetSymbol);
        set({
          priceAlerts: get().priceAlerts.map((pa) =>
            pa.id === alert.id ? { ...pa, triggeredAt: new Date().toISOString() } : pa
          ),
        });
        notifyAlert('Price Alert', `${alert.assetSymbol} moved ${alert.condition.direction}`);
      }
    });

    portfolioAlerts.forEach((alert) => {
      const baseline = wallet.activities.reduce((acc, activity) => {
        if ('valueUsd' in activity.to) {
          return acc + activity.to.valueUsd;
        }
        return acc;
      }, 0);
      if (!baseline) return;
      const change = ((totalValue - baseline) / baseline) * 100;
      const shouldTrigger =
        alert.direction === 'up' ? change >= alert.thresholdPercent : change <= -alert.thresholdPercent;
      if (shouldTrigger && (!alert.triggeredAt || alert.repeating)) {
        triggered.push('PORTFOLIO');
        set({
          portfolioAlerts: get().portfolioAlerts.map((pa) =>
            pa.id === alert.id ? { ...pa, triggeredAt: new Date().toISOString() } : pa
          ),
        });
        notifyAlert('Portfolio Alert', `Balance moved ${alert.direction === 'up' ? '+' : '-'}${alert.thresholdPercent}%`);
      }
    });

    if (triggered.length > 0) {
      set((state: AppStoreState) => ({
        debugLogs: [...state.debugLogs, `Alerts triggered for ${triggered.join(', ')}`],
      }));
    }
  },
});

const createDevSlice = (set: any, get: () => AppStoreState): DevSlice => ({
  sandboxMode: true,
  transactionSpeed: 'normal',
  debugLogs: ['Developer console initialised'],
  setTransactionSpeed: (speed) => set({ transactionSpeed: speed }),
  toggleSandboxMode: () =>
    set((state: AppStoreState) => ({
      sandboxMode: !state.sandboxMode,
      debugLogs: [...state.debugLogs, `Sandbox mode ${!state.sandboxMode ? 'enabled' : 'disabled'}`],
    })),
  appendDebugLog: (message) =>
    set((state: AppStoreState) => ({ debugLogs: [...state.debugLogs, `${dayjs().format('HH:mm:ss')} ${message}`] })),
  clearStorage: async () => {
    await AsyncStorage.clear();
    set((state: AppStoreState) => ({
      debugLogs: [...state.debugLogs, 'AsyncStorage cleared'],
    }));
  },
});

const createGamificationSlice = (set: any): GamificationSlice => ({
  dailyStreak: 1,
  lastLoginAt: dayjs().subtract(1, 'day').toISOString(),
  rewardsClaimed: [],
  achievements: defaultAchievements,
  leaderboard: [
    { id: 'you', name: 'You', balance: 240000, streak: 3 },
    { id: 'satoshi', name: 'Satoshi', balance: 350000, streak: 12 },
    { id: 'vitalik', name: 'Vitalik', balance: 285000, streak: 9 },
  ],
  recordLogin: () =>
    set((state: AppStoreState) => {
      const today = dayjs();
      const last = state.lastLoginAt ? dayjs(state.lastLoginAt) : null;
      let dailyStreak = state.dailyStreak;
      if (!last || today.diff(last, 'day') > 1) {
        dailyStreak = 1;
      } else if (today.diff(last, 'day') === 1) {
        dailyStreak += 1;
      }
      return {
        dailyStreak,
        lastLoginAt: today.toISOString(),
      };
    }),
  grantAchievement: (achievement) =>
    set((state: AppStoreState) => {
      if (state.achievements.some((a) => a.id === achievement.id)) {
        return state;
      }
      return {
        achievements: [
          ...state.achievements,
          { ...achievement, earnedAt: achievement.earnedAt ?? new Date().toISOString() },
        ],
      };
    }),
  updateLeaderboard: (entries) => set({ leaderboard: entries }),
});

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => {
      const initialWallet = seedWallet({ id: 'wallet_main', name: 'Main Wallet' });
      return {
        ...createAppSlice(set),
        ...createSecuritySlice(set, () => get()),
        ...createWalletSlice((update: any) => {
          set(update);
        }, () => get()),
        ...createMarketSlice(set),
        ...createAlertSlice(set, () => get()),
        ...createDevSlice(set, () => get()),
        ...createGamificationSlice(set),
        activeWalletId: initialWallet.id,
        wallets: [initialWallet, createWatchWallet(), createSimulationWallet()],
      };
    },
    {
      name: 'pro-crypto-wallet-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: AppStoreState) => ({
        theme: state.theme,
        currency: state.currency,
        language: state.language,
        displayCurrencies: state.displayCurrencies,
        priceAlertsEnabled: state.priceAlertsEnabled,
        biometricEnabled: state.biometricEnabled,
        passcode: state.passcode,
        lockOnBackground: state.lockOnBackground,
        wallets: state.wallets,
        activeWalletId: state.activeWalletId,
        priceAlerts: state.priceAlerts,
        portfolioAlerts: state.portfolioAlerts,
        sandboxMode: state.sandboxMode,
        transactionSpeed: state.transactionSpeed,
        debugLogs: state.debugLogs,
        dailyStreak: state.dailyStreak,
        lastLoginAt: state.lastLoginAt,
        rewardsClaimed: state.rewardsClaimed,
        achievements: state.achievements,
        leaderboard: state.leaderboard,
      }),
    }
  )
);

export const selectActiveWallet = (state: AppStoreState) =>
  state.wallets.find((wallet) => wallet.id === state.activeWalletId) ?? state.wallets[0];

export const selectPortfolioValue = (state: AppStoreState, wallet?: Wallet) => {
  const targetWallet = wallet ?? selectActiveWallet(state);
  return targetWallet.holdings.reduce((total, holding) => {
    const price = state.quotes[holding.id]?.current_price ?? 0;
    return total + holding.amount * price;
  }, 0);
};

export const selectPnl = (state: AppStoreState, timeframe: '24h' | '7d' | 'all', wallet?: Wallet) => {
  const targetWallet = wallet ?? selectActiveWallet(state);
  const totalValue = selectPortfolioValue(state, targetWallet);
  const referenceValue = targetWallet.holdings.reduce((acc, holding) => {
    const quote = state.quotes[holding.id];
    if (!quote) return acc;
    if (timeframe === '24h') {
      const price24 = quote.current_price / (1 + (quote.price_change_percentage_24h ?? 0) / 100);
      return acc + price24 * holding.amount;
    }
    if (timeframe === '7d') {
      const price7d = quote.current_price / 1.1;
      return acc + price7d * holding.amount;
    }
    return acc + quote.current_price * holding.amount - 50 * holding.amount;
  }, 0);
  const valueChange = totalValue - referenceValue;
  const percent = referenceValue === 0 ? 0 : valueChange / referenceValue;
  return { value: valueChange, percent };
};

export const selectHoldingsAllocation = (state: AppStoreState, wallet?: Wallet) => {
  const targetWallet = wallet ?? selectActiveWallet(state);
  const total = selectPortfolioValue(state, targetWallet);
  return targetWallet.holdings.map((holding) => {
    const price = state.quotes[holding.id]?.current_price ?? 0;
    const value = price * holding.amount;
    return {
      id: holding.id,
      symbol: holding.symbol,
      value,
      percentage: total === 0 ? 0 : (value / total) * 100,
    };
  });
};

export const selectSwapAnalytics = (state: AppStoreState, wallet?: Wallet) => {
  const targetWallet = wallet ?? selectActiveWallet(state);
  const swaps = targetWallet.activities.filter((activity) => activity.type === 'swap');
  const totals = swaps.reduce(
    (acc, activity) => {
      acc.totalVolume += activity.from.valueUsd ?? 0;
      acc.count += 1;
      return acc;
    },
    { totalVolume: 0, count: 0 }
  );
  return {
    totalVolume: totals.totalVolume,
    swapCount: totals.count,
    averageEntry: totals.count ? totals.totalVolume / totals.count : 0,
  };
};

