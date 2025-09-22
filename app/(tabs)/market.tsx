import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PriceChart from '../../components/PriceChart';
import Segmented from '../../components/Segmented';
import Skeleton from '../../components/Skeleton';
import TokenRow from '../../components/TokenRow';
import { useTranslation } from '../../services/i18n';
import { fetchTopTokens } from '../../services/prices';
import { notifyAlert } from '../../services/notifications';
import { formatCurrency } from '../../services/formatting';
import { useAppStore } from '../../state/store';
import { Token } from '../../types/market';

const FILTERS = ['Hot', 'Top', 'New', 'Gainers', 'Losers'] as const;
type MarketFilter = (typeof FILTERS)[number];

const MarketScreen = () => {
  const { t } = useTranslation();
  const {
    currency,
    tokens,
    tokensLoading,
    priceAlerts,
    portfolioAlerts,
    news,
    addPriceAlert,
    removePriceAlert,
    addPortfolioAlert,
  } = useAppStore((state) => ({
    currency: state.currency,
    tokens: state.tokens,
    tokensLoading: state.tokensLoading,
    priceAlerts: state.priceAlerts,
    portfolioAlerts: state.portfolioAlerts,
    news: state.news,
    addPriceAlert: state.addPriceAlert,
    removePriceAlert: state.removePriceAlert,
    addPortfolioAlert: state.addPortfolioAlert,
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MarketFilter>('Hot');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [priceTarget, setPriceTarget] = useState('');
  const [percentChange, setPercentChange] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [repeating, setRepeating] = useState(false);
  const [portfolioThreshold, setPortfolioThreshold] = useState('5');
  const [portfolioDirection, setPortfolioDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    if (!tokens.length) {
      fetchTopTokens(currency);
    }
  }, [currency, tokens.length]);

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let list = tokens.filter((token) => token.name.toLowerCase().includes(query) || token.symbol.toLowerCase().includes(query));
    if (activeFilter === 'Gainers') {
      list = [...list].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else if (activeFilter === 'Losers') {
      list = [...list].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    }
    return list;
  }, [tokens, searchQuery, activeFilter]);

  const handleAddPriceAlert = () => {
    if (!selectedToken) return;
    const targetValue = priceTarget ? Number(priceTarget) : undefined;
    const percentValue = percentChange ? Number(percentChange) : undefined;
    if (!targetValue && !percentValue) return;
    const alert = addPriceAlert({
      assetId: selectedToken.id,
      assetSymbol: selectedToken.symbol.toUpperCase(),
      condition: { targetPrice: targetValue, percentChange: percentValue, direction },
      repeating,
    });
    notifyAlert('Alert Saved', `Tracking ${alert.assetSymbol} ${direction} targets`);
    setPriceTarget('');
    setPercentChange('');
  };

  const handlePortfolioAlert = () => {
    const threshold = Number(portfolioThreshold);
    if (!threshold) return;
    addPortfolioAlert({ thresholdPercent: threshold, direction: portfolioDirection, repeating: true });
  };

  const handleTokenPress = (token: Token) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedToken(selectedToken?.id === token.id ? null : token);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('alerts')} & Market</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a token"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Segmented options={FILTERS} selected={activeFilter} onSelect={(option) => setActiveFilter(option as MarketFilter)} />

        {selectedToken && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{selectedToken.name}</Text>
              <Text style={styles.chartPrice}>{formatCurrency(selectedToken.current_price, currency)}</Text>
            </View>
            <PriceChart tokenId={selectedToken.id} />
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('alerts')}</Text>
        <View style={styles.alertForm}>
          <Text style={styles.helper}>Select an asset below then set target price or % change</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Target price"
              placeholderTextColor="#6B7280"
              value={priceTarget}
              onChangeText={setPriceTarget}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="% change"
              placeholderTextColor="#6B7280"
              value={percentChange}
              onChangeText={setPercentChange}
            />
          </View>
          <View style={styles.row}>
            <Pressable
              style={[styles.directionChip, direction === 'above' && styles.directionChipActive]}
              onPress={() => setDirection('above')}
            >
              <Text style={[styles.directionLabel, direction === 'above' && styles.directionLabelActive]}>Above</Text>
            </Pressable>
            <Pressable
              style={[styles.directionChip, direction === 'below' && styles.directionChipActive]}
              onPress={() => setDirection('below')}
            >
              <Text style={[styles.directionLabel, direction === 'below' && styles.directionLabelActive]}>Below</Text>
            </Pressable>
            <Pressable style={[styles.directionChip, repeating && styles.directionChipActive]} onPress={() => setRepeating((prev) => !prev)}>
              <Text style={[styles.directionLabel, repeating && styles.directionLabelActive]}>Repeat</Text>
            </Pressable>
          </View>
          <Pressable style={styles.primaryButton} onPress={handleAddPriceAlert}>
            <Text style={styles.primaryLabel}>Save Alert</Text>
          </Pressable>
        </View>

        <View style={styles.alertList}>
          {priceAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View>
                <Text style={styles.alertTitle}>{alert.assetSymbol}</Text>
                <Text style={styles.alertMeta}>
                  {alert.condition.targetPrice ? `Target ${alert.condition.direction} ${alert.condition.targetPrice}` : ''}
                  {alert.condition.percentChange ? ` • ${alert.condition.percentChange}% change` : ''}
                </Text>
              </View>
              <Pressable onPress={() => removePriceAlert(alert.id)}>
                <Ionicons name="trash" size={18} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Portfolio Alerts</Text>
        <View style={styles.alertForm}>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="% threshold"
              placeholderTextColor="#6B7280"
              value={portfolioThreshold}
              onChangeText={setPortfolioThreshold}
            />
            <Pressable
              style={[styles.directionChip, portfolioDirection === 'up' && styles.directionChipActive]}
              onPress={() => setPortfolioDirection('up')}
            >
              <Text style={[styles.directionLabel, portfolioDirection === 'up' && styles.directionLabelActive]}>Up</Text>
            </Pressable>
            <Pressable
              style={[styles.directionChip, portfolioDirection === 'down' && styles.directionChipActive]}
              onPress={() => setPortfolioDirection('down')}
            >
              <Text style={[styles.directionLabel, portfolioDirection === 'down' && styles.directionLabelActive]}>Down</Text>
            </Pressable>
          </View>
          <Pressable style={styles.primaryButton} onPress={handlePortfolioAlert}>
            <Text style={styles.primaryLabel}>Set Portfolio Alert</Text>
          </Pressable>
          {portfolioAlerts.map((alert) => (
            <Text key={alert.id} style={styles.alertMeta}>
              Trigger when {alert.direction === 'up' ? 'gain' : 'loss'} exceeds {alert.thresholdPercent}%
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Market Movers</Text>
        {tokensLoading && !tokens.length ? (
          <View style={{ gap: 12 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height={74} />
            ))}
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={filteredTokens}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TokenRow token={item} currency={currency} onPress={() => handleTokenPress(item)} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}

        <Text style={styles.sectionTitle}>News Alerts</Text>
        {news.map((article) => (
          <Pressable key={article.id} style={styles.newsCard} onPress={() => WebBrowser.openBrowserAsync(article.url)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.newsTitle}>{article.title}</Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color="#60A5FA" />
            </View>
            <Text style={styles.newsSummary}>{article.summary}</Text>
            <Text style={styles.newsSource}>{article.source}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111927',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  chartPrice: {
    color: '#60A5FA',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  alertForm: {
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  helper: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  directionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
  },
  directionChipActive: {
    backgroundColor: '#2563EB',
  },
  directionLabel: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  directionLabelActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertList: {
    marginTop: 12,
    gap: 12,
  },
  alertItem: {
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  alertTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  newsCard: {
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  newsSummary: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  newsSource: {
    color: '#6B7280',
    fontSize: 12,
  },
});

export default MarketScreen;

