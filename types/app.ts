import { Activity, Holding } from './market';

export type Language = 'en' | 'ar';
export type ThemeOption = 'light' | 'dark' | 'oled' | 'system';
export type TransactionSpeed = 'fast' | 'normal' | 'cheap';

export type WalletType = 'standard' | 'watch' | 'simulation';

export interface WalletMetadata {
  id: string;
  name: string;
  type: WalletType;
  address?: string;
  seedPhrase?: string;
  isArchived?: boolean;
  watchAssets?: string[];
  createdAt: string;
}

export interface Wallet extends WalletMetadata {
  holdings: Holding[];
  activities: Activity[];
  autoSwapRules: AutoSwapRule[];
  favoritePairs: string[];
  achievements: AchievementId[];
  sandboxBalance?: number;
}

export interface AutoSwapRule {
  id: string;
  fromAsset: string;
  toAsset: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  nextRun: string;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  assetSymbol: string;
  condition: {
    targetPrice?: number;
    percentChange?: number;
    direction: 'above' | 'below';
  };
  repeating: boolean;
  triggeredAt?: string;
}

export interface PortfolioAlert {
  id: string;
  thresholdPercent: number;
  direction: 'up' | 'down';
  repeating: boolean;
  triggeredAt?: string;
}

export interface NewsAlert {
  id: string;
  assetId: string;
  title: string;
  url: string;
  publishedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  balance: number;
  streak: number;
}

export type AchievementId =
  | 'first_swap'
  | 'five_swaps'
  | 'watch_wallet_added'
  | 'alerts_created'
  | 'sandbox_enabled';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  earnedAt?: string;
}

export interface GamificationState {
  dailyStreak: number;
  lastLoginAt?: string;
  rewardsClaimed: string[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
}

export interface DevSettingsState {
  sandboxMode: boolean;
  transactionSpeed: TransactionSpeed;
  debugLogs: string[];
}

export interface SecurityState {
  biometricEnabled: boolean;
  passcode?: string; // stored hashed
  locked: boolean;
  lockOnBackground: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
}

export interface BenchmarkPoint {
  timestamp: number;
  portfolio: number;
  btc: number;
  eth: number;
}

export interface MarketSliceState {
  tokensLoading: boolean;
  tokensError?: string;
  benchmarks: BenchmarkPoint[];
  news: NewsArticle[];
}

