/**
 * Market Screen: Allows users to discover and search for cryptocurrencies.
 * It features a search bar with debouncing, category filters, and a sort menu.
 * Tapping a token reveals an inline detail view with a price chart and action buttons.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Empty from '../../components/Empty';
import PriceChart from '../../components/PriceChart';
import Segmented from '../../components/Segmented';
import TokenRow from '../../components/TokenRow';
import { fetchTopTokens } from '../../services/prices';
import { useAppStore } from '../../state/appStore';
import { Token } from '../../types/market';

const FILTERS = ['Hot', 'Top', 'New', 'Gainers', 'Losers'] as const;
type MarketFilter = (typeof FILTERS)[number];
const SORT_OPTIONS = ['Price', '% 24h', 'Name'] as const;

export default function MarketScreen() {
  const router = useRouter();
  const { currency } = useAppStore();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MarketFilter>(FILTERS[0]);
  const [sortOption, setSortOption] = useState<(typeof SORT_OPTIONS)[number]>(SORT_OPTIONS[0]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTokens = await fetchTopTokens(currency);
      setTokens(fetchedTokens);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredAndSortedTokens = useMemo(() => {
    let result = tokens.filter(
      (t) =>
        t.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        t.symbol.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
    // Add filtering logic for 'Hot', 'Top', 'New' if API supports it
    if (activeFilter === 'Gainers') {
        result.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else if (activeFilter === 'Losers') {
        result.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    }

    if(sortOption === 'Price') result.sort((a, b) => b.current_price - a.current_price);
    if(sortOption === '% 24h') result.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    if(sortOption === 'Name') result.sort((a, b) => a.name.localeCompare(b.name));
    
    return result;
  }, [tokens, debouncedQuery, activeFilter, sortOption]);

  const handleTokenPress = (token: Token) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedToken(selectedToken?.id === token.id ? null : token);
  };
  
  if (loading && tokens.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  const renderTokenDetail = () => {
    if (!selectedToken) return null;
    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedToken.name} Price</Text>
            <Pressable onPress={() => handleTokenPress(selectedToken)}>
                <Ionicons name="close-circle" size={24} color="#6B768A"/>
            </Pressable>
        </View>
        <PriceChart tokenId={selectedToken.id} />
        <View style={styles.actionButtons}>
          <Pressable style={[styles.button, styles.buyButton]}><Text style={styles.buttonText}>Buy</Text></Pressable>
          <Pressable style={[styles.button, styles.sellButton]}><Text style={styles.buttonText}>Sell</Text></Pressable>
          <Pressable style={[styles.button, styles.swapButton]} onPress={() => router.push('/(tabs)/trade')}><Text style={styles.buttonText}>Swap</Text></Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B768A" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a token..."
          placeholderTextColor="#6B768A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Segmented
          options={FILTERS}
          selected={activeFilter}
          onSelect={(option) => setActiveFilter(option as MarketFilter)}
        />
      </View>

      {renderTokenDetail()}

      <FlatList
        data={filteredAndSortedTokens}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TokenRow token={item} currency={currency} onPress={() => handleTokenPress(item)}/>}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Empty message="No tokens found." actionTitle="Clear Search" onAction={() => setSearchQuery('')} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111927',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  detailContainer: {
    backgroundColor: '#111927',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
  },
  detailTitle: {
      color: '#FFF',
      fontFamily: 'Inter-Bold',
      fontSize: 18
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buyButton: { backgroundColor: '#1DB954' },
  sellButton: { backgroundColor: '#EF4444' },
  swapButton: { backgroundColor: '#2F80ED' },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
});
