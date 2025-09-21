/**
 * Dashboard Screen: The main landing page of the app.
 * It displays the user's total portfolio balance, 24h performance,
 * a list of their holdings, and provides quick access to search and trading.
 * It polls for price updates periodically to keep the data fresh.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Appearance,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BalanceCard from '../../components/BalanceCard';
import Empty from '../../components/Empty';
import Segmented from '../../components/Segmented';
import TokenRow from '../../components/TokenRow';
import { fetchTopTokens, useTokenStore } from '../../services/prices';
import { useAppStore } from '../../state/appStore';
import { usePnl24h, usePortfolioStore, usePortfolioValue } from '../../state/portfolioStore';

const FILTERS = ['Hot', 'Top', 'New', 'Gainers', 'Losers'];

export default function DashboardScreen() {
  const router = useRouter();
  const { currency, theme } = useAppStore();
  const { holdings } = usePortfolioStore();
  const portfolioValue = usePortfolioValue();
  const pnl24h = usePnl24h();

  const { tokens, loading, setTokens } = useTokenStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  const colorScheme = theme === 'system' ? Appearance.getColorScheme() : theme;
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
        useTokenStore.setState({ loading: true });
    }
    try {
      const fetchedTokens = await fetchTopTokens(currency);
      setTokens(fetchedTokens);
      const quotes = fetchedTokens.reduce((acc, token) => {
          acc[token.id] = {
              current_price: token.current_price,
              price_change_percentage_24h: token.price_change_percentage_24h
          };
          return acc;
      }, {} as Record<string, any>);
      usePortfolioStore.getState().setQuotes(quotes);

    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
        useTokenStore.setState({ loading: false });
        if (isRefresh) {
            setRefreshing(false);
        }
    }
  }, [currency, setTokens]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000); // 30 seconds polling
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);
  
  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fromAsset = holdings.length > 0 ? holdings[0].id : undefined;
    router.push({ pathname: '/(tabs)/trade', params: { from: fromAsset } });
  };
  
  const holdingIds = new Set(holdings.map((h) => h.id));
  const portfolioTokens = tokens.filter((t) => holdingIds.has(t.id));
  const otherTokens = tokens.filter((t) => !holdingIds.has(t.id));
  
  const renderHeader = () => (
    <>
      <BalanceCard
        totalValue={portfolioValue}
        pnlValue={pnl24h.value}
        pnlPercent={pnl24h.percent}
        currency={currency}
      />
      <View style={{ marginTop: 24, marginBottom: 16 }}>
        <Segmented
          options={FILTERS}
          selected={activeFilter}
          onSelect={(option) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveFilter(option);
          }}
        />
      </View>
      {portfolioTokens.length > 0 && (
         <Text style={styles.sectionHeader}>My Assets</Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerActions}>
           <Link href="/(tabs)/market" asChild>
            <Pressable>
              <Ionicons name="search" size={24} color={styles.headerTitle.color} />
            </Pressable>
          </Link>
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={styles.headerTitle.color} />
          </Pressable>
        </View>
      </View>

       {loading && tokens.length === 0 ? (
          <ActivityIndicator size="large" color={isDarkMode ? "#FFF" : "#000"} style={{ flex: 1 }} />
       ) : (
          <FlatList
            data={portfolioTokens}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={
                <>
                    {otherTokens.length > 0 && (
                        <Text style={[styles.sectionHeader, {marginTop: 16}]}>Watchlist</Text>
                    )}
                    {otherTokens.map(token => <TokenRow key={token.id} token={token} currency={currency} />)}
                </>
            }
            ListEmptyComponent={<Empty message="No assets yet." actionTitle="Explore Market" onAction={() => router.push('/(tabs)/market')}/>}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TokenRow token={item} currency={currency} />}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#FFF" : "#000"} />}
          />
       )}
       
      <Pressable style={styles.fab} onPress={handleFabPress}>
        <MaterialCommunityIcons name="swap-horizontal" size={28} color="#FFFFFF" />
      </Pressable>

    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0B1220' : '#F6F8FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: isDarkMode ? '#FFFFFF' : '#0B1220',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    color: isDarkMode ? '#E6ECF5' : '#0B1220',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});