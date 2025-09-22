import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

import DeveloperConsole from '../../components/dev/DeveloperConsole';
import AiAssistantPanel from '../../components/analytics/AiAssistantPanel';
import BenchmarkChart from '../../components/analytics/BenchmarkChart';
import HoldingsPieChart from '../../components/analytics/HoldingsPieChart';
import BalanceCard from '../../components/BalanceCard';
import Skeleton from '../../components/Skeleton';
import TokenRow from '../../components/TokenRow';
import WalletManagerModal from '../../components/WalletManagerModal';
import WalletQrModal from '../../components/social/WalletQrModal';
import { useTranslation } from '../../services/i18n';
import { fetchBenchmarks, fetchTopTokens } from '../../services/prices';
import { formatCurrency } from '../../services/formatting';
import { useAppStore } from '../../state/store';
import {
  useActiveWallet,
  useHoldingsAllocation,
  usePnl24h,
  usePnl7d,
  usePnlAllTime,
  usePortfolioValue,
  useSwapAnalytics,
} from '../../state/portfolioStore';
import { Token } from '../../types/market';

const DashboardScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const viewShotRef = useRef<ViewShot>(null);

  const {
    currency,
    displayCurrencies,
    tokens,
    tokensLoading,
    benchmarks,
    dailyStreak,
    achievements,
    leaderboard,
    priceAlerts,
    portfolioAlerts,
    evaluateAlerts,
    tokensError,
  } = useAppStore((state) => ({
    currency: state.currency,
    displayCurrencies: state.displayCurrencies,
    tokens: state.tokens,
    tokensLoading: state.tokensLoading,
    benchmarks: state.benchmarks,
    dailyStreak: state.dailyStreak,
    achievements: state.achievements,
    leaderboard: state.leaderboard,
    priceAlerts: state.priceAlerts,
    portfolioAlerts: state.portfolioAlerts,
    evaluateAlerts: state.evaluateAlerts,
    tokensError: state.tokensError,
  }));

  const activeWallet = useActiveWallet();
  const holdingsAllocation = useHoldingsAllocation();
  const portfolioValue = usePortfolioValue();
  const pnl24h = usePnl24h();
  const pnl7d = usePnl7d();
  const pnlAllTime = usePnlAllTime();
  const swapAnalytics = useSwapAnalytics();

  const [timeframe, setTimeframe] = useState<'24h' | '7d' | 'all'>('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [shareHidden, setShareHidden] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [developerVisible, setDeveloperVisible] = useState(false);

  const pnl = timeframe === '24h' ? pnl24h : timeframe === '7d' ? pnl7d : pnlAllTime;

  const holdingTokens = useMemo(() => {
    const map = new Map(tokens.map((token) => [token.id, token] as [string, Token]));
    return activeWallet.holdings
      .map((holding) => map.get(holding.id))
      .filter(Boolean) as Token[];
  }, [tokens, activeWallet.holdings]);

  const watchlistTokens = useMemo(() => tokens.filter((token) => !holdingTokens.includes(token)), [tokens, holdingTokens]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchTopTokens(currency);
    await fetchBenchmarks(portfolioValue, currency);
    setRefreshing(false);
  }, [currency, portfolioValue]);

  const handleShare = async () => {
    try {
      setShareHidden(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri);
      }
    } finally {
      setShareHidden(false);
    }
  };

  const handleOpenQr = () => setQrVisible(true);
  const handleDeveloperShortcut = () => setDeveloperVisible(true);

  React.useEffect(() => {
    evaluateAlerts(activeWallet, portfolioValue);
  }, [activeWallet, portfolioValue, tokens, evaluateAlerts]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{activeWallet.name}</Text>
          <Text style={styles.subGreeting}>{t('portfolio')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons name="flame-outline" size={20} color="#FBBF24" />
          <Text style={styles.streak}>{t('streak')}: {dailyStreak} 🔥</Text>
          <Pressable onPress={() => setWalletModalVisible(true)} style={styles.walletSwitch}>
            <MaterialCommunityIcons name="wallet" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}>
        <ViewShot ref={viewShotRef} style={styles.cardWrapper}>
          <BalanceCard
            totalValue={portfolioValue}
            pnlValue={pnl.value}
            pnlPercent={pnl.percent}
            currency={currency}
            secondaryCurrencies={displayCurrencies}
            onSelectTimeframe={setTimeframe}
            activeTimeframe={timeframe}
            onShare={handleShare}
            onShowQr={handleOpenQr}
            onDeveloperShortcut={handleDeveloperShortcut}
            forceHidden={shareHidden}
          />
        </ViewShot>

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Achievements</Text>
            <Text style={styles.statValue}>{achievements.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Alerts</Text>
            <Text style={styles.statValue}>{priceAlerts.length + portfolioAlerts.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Swap Volume</Text>
            <Text style={styles.statValue}>{formatCurrency(swapAnalytics.totalVolume, currency)}</Text>
          </View>
        </View>

        {tokensError ? (
          <Pressable style={styles.errorBanner} onPress={onRefresh}>
            <Text style={styles.errorText}>{tokensError}</Text>
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </Pressable>
        ) : null}

        <HoldingsPieChart data={holdingsAllocation} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementRow}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementChip}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
          ))}
        </ScrollView>
        <BenchmarkChart data={benchmarks} />
        <AiAssistantPanel onOpenBrowser={(url) => WebBrowser.openBrowserAsync(url)} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('holdings')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.link}>View History</Text>
          </Pressable>
        </View>

        {tokensLoading ? (
          <View style={{ gap: 12 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} height={74} />
            ))}
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={holdingTokens}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TokenRow token={item} currency={currency} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No assets yet - explore the market.</Text>}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('watchlist')}</Text>
        </View>
        <FlatList
          scrollEnabled={false}
          data={watchlistTokens.slice(0, 5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TokenRow token={item} currency={currency} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leaderboardRow}>
          {leaderboard.map((entry) => (
            <View key={entry.id} style={styles.leaderItem}>
              <Text style={styles.leaderName}>{entry.name}</Text>
              <Text style={styles.leaderBalance}>{formatCurrency(entry.balance, currency)}</Text>
              <Text style={styles.leaderStreak}>{entry.streak} day streak</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/trade')}>
        <MaterialCommunityIcons name="swap-horizontal" size={28} color="#FFFFFF" />
      </Pressable>

      <WalletManagerModal visible={walletModalVisible} onClose={() => setWalletModalVisible(false)} />
      <WalletQrModal visible={qrVisible} address={activeWallet.address ?? '0x1234...abcd'} onClose={() => setQrVisible(false)} />
      <DeveloperConsole visible={developerVisible} onClose={() => setDeveloperVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#0B1220',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subGreeting: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  streak: {
    color: '#FBBF24',
    fontWeight: '600',
  },
  walletSwitch: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 8,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  achievementRow: {
    gap: 12,
    marginBottom: 12,
  },
  achievementChip: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 14,
    width: 180,
    gap: 6,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  achievementDescription: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontWeight: '600',
  },
  errorRetry: {
    color: '#FFFFFF',
    marginTop: 4,
    fontSize: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#60A5FA',
  },
  emptyText: {
    color: '#6B7280',
    marginVertical: 16,
    textAlign: 'center',
  },
  leaderboardRow: {
    gap: 12,
    paddingVertical: 8,
  },
  leaderItem: {
    width: 160,
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  leaderName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  leaderBalance: {
    color: '#60A5FA',
  },
  leaderStreak: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default DashboardScreen;

