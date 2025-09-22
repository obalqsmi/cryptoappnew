import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Segmented from '../../components/Segmented';
import Skeleton from '../../components/Skeleton';
import { formatCompact, formatCurrency } from '../../services/formatting';
import { useAppStore } from '../../state/store';
import { useActiveWallet, useSwapAnalytics } from '../../state/portfolioStore';
import { Activity } from '../../types/market';

dayjs.extend(localizedFormat);

const TYPE_FILTERS = ['All', 'Swaps', 'Transfers', 'Earn'] as const;
const DATE_FILTERS = ['30D', '90D', 'All'] as const;

const FILTER_MAP: Record<(typeof TYPE_FILTERS)[number], Activity['type'][]> = {
  All: ['swap', 'send', 'receive', 'stake'],
  Swaps: ['swap'],
  Transfers: ['send', 'receive'],
  Earn: ['stake'],
};

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  switch (type) {
    case 'swap':
      return <MaterialCommunityIcons name="swap-horizontal-bold" size={22} color="#60A5FA" />;
    case 'send':
      return <Ionicons name="arrow-up-circle" size={22} color="#F87171" />;
    case 'receive':
      return <Ionicons name="arrow-down-circle" size={22} color="#34D399" />;
    case 'stake':
      return <MaterialCommunityIcons name="lock" size={22} color="#A855F7" />;
    default:
      return <Ionicons name="help-circle" size={22} color="#9CA3AF" />;
  }
};

const formatAddress = (address?: string) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown');

const HistoryScreen = () => {
  const { currency } = useAppStore((state) => ({ currency: state.currency }));
  const activeWallet = useActiveWallet();
  const swapAnalytics = useSwapAnalytics();
  const activities = activeWallet.activities;
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('All');
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]>('30D');
  const [assetFilter, setAssetFilter] = useState<string>('All');

  const assets = useMemo(() => {
    const symbols = new Set<string>();
    activities.forEach((activity) => {
      if ('symbol' in activity.from) {
        symbols.add(activity.from.symbol.toUpperCase());
      }
      if ('symbol' in activity.to) {
        symbols.add(activity.to.symbol.toUpperCase());
      }
    });
    return ['All', ...Array.from(symbols)];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const types = FILTER_MAP[typeFilter];
    const now = dayjs();
    const cutoff = dateFilter === '30D' ? now.subtract(30, 'day') : dateFilter === '90D' ? now.subtract(90, 'day') : null;
    return activities.filter((activity) => {
      const matchesType = types.includes(activity.type);
      const matchesDate = cutoff ? dayjs(activity.date).isAfter(cutoff) : true;
      const matchesAsset = (() => {
        if (assetFilter === 'All') return true;
        const fromSymbol = 'symbol' in activity.from ? activity.from.symbol.toUpperCase() : null;
        const toSymbol = 'symbol' in activity.to ? activity.to.symbol.toUpperCase() : null;
        return fromSymbol === assetFilter || toSymbol === assetFilter;
      })();
      return matchesType && matchesDate && matchesAsset;
    });
  }, [activities, typeFilter, dateFilter, assetFilter]);

  const groupedSections = useMemo(() => {
    const grouped = filteredActivities.reduce<Record<string, Activity[]>>((acc, activity) => {
      const date = dayjs(activity.date).format('MMMM D, YYYY');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [filteredActivities]);

  const exportData = async (extension: 'csv' | 'xlsx') => {
    if (!filteredActivities.length) {
      Alert.alert('Nothing to export');
      return;
    }
    const baseDirectory = cacheDirectory ?? '';
    if (!baseDirectory) {
      Alert.alert('Export unavailable', 'Storage directory is not accessible.');
      return;
    }

    const headers = 'date,type,fromSymbol,fromAmount,toSymbol,toAmount\n';
    const rows = filteredActivities
      .map((activity) => {
        let fromSymbol = '';
        let fromAmount = '';
        let toSymbol = '';
        let toAmount = '';

        switch (activity.type) {
          case 'swap':
            fromSymbol = activity.from.symbol;
            fromAmount = String(activity.from.amount);
            toSymbol = activity.to.symbol;
            toAmount = String(activity.to.amount);
            break;
          case 'send':
            fromSymbol = activity.from.symbol;
            fromAmount = String(activity.from.amount);
            break;
          case 'receive':
            toSymbol = activity.to.symbol;
            toAmount = String(activity.to.amount);
            break;
          case 'stake':
            fromSymbol = activity.from.symbol;
            fromAmount = String(activity.from.amount);
            toSymbol = activity.to.validator;
            break;
          default:
            break;
        }

        return `${dayjs(activity.date).toISOString()},${activity.type},${fromSymbol},${fromAmount},${toSymbol},${toAmount}`;
      })
      .join('\n');
    const content = headers + rows;
    const filename = `${baseDirectory}history.${extension}`;
    await writeAsStringAsync(filename, content);
    await Sharing.shareAsync(filename, { mimeType: 'text/csv', dialogTitle: 'Export History' });
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const isSwap = item.type === 'swap';
    const isSend = item.type === 'send';
    const isReceive = item.type === 'receive';
    const isStake = item.type === 'stake';

    let subtitle: string;
    if (isSwap) {
      subtitle = `${item.from.symbol} → ${item.to.symbol}`;
    } else if (isSend) {
      subtitle = `To ${formatAddress(item.to.address)}`;
    } else if (isReceive) {
      subtitle = `From ${formatAddress(item.from.address)}`;
    } else {
      subtitle = `Validator ${formatAddress(item.to.validator)}`;
    }

    return (
      <View style={styles.row}>
        <ActivityIcon type={item.type} />
        <View style={styles.rowCenter}>
          <Text style={styles.rowTitle}>{item.type.toUpperCase()}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.rowRight}>
          {isSwap && (
            <Text style={styles.rowAmount}>
              {formatCompact(item.to.amount)} {item.to.symbol}
            </Text>
          )}
          {isSend && (
            <Text style={styles.amountNegative}>
              - {formatCompact(item.from.amount)} {item.from.symbol}
            </Text>
          )}
          {isReceive && (
            <Text style={styles.amountPositive}>
              + {formatCompact(item.to.amount)} {item.to.symbol}
            </Text>
          )}
          {isStake && (
            <Text style={styles.amountMuted}>
              {formatCompact(item.from.amount)} {item.from.symbol}
            </Text>
          )}
          <Text style={styles.rowSubtitle}>{dayjs(item.date).format('MMM D, h:mm A')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.exportRow}>
          <Pressable style={styles.exportButton} onPress={() => exportData('csv')}>
            <Text style={styles.exportLabel}>Export CSV</Text>
          </Pressable>
          <Pressable style={styles.exportButton} onPress={() => exportData('xlsx')}>
            <Text style={styles.exportLabel}>Export Excel</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.analyticsCard}>
        <View style={styles.analyticsColumn}>
          <Text style={styles.analyticsLabel}>Total Swaps</Text>
          <Text style={styles.analyticsValue}>{swapAnalytics.swapCount}</Text>
        </View>
        <View style={styles.analyticsColumn}>
          <Text style={styles.analyticsLabel}>Volume</Text>
          <Text style={styles.analyticsValue}>{formatCurrency(swapAnalytics.totalVolume, currency)}</Text>
        </View>
        <View style={styles.analyticsColumn}>
          <Text style={styles.analyticsLabel}>Avg Entry</Text>
          <Text style={styles.analyticsValue}>{formatCurrency(swapAnalytics.averageEntry, currency)}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <Segmented options={TYPE_FILTERS} selected={typeFilter} onSelect={(option) => setTypeFilter(option as (typeof TYPE_FILTERS)[number])} />
        <Segmented options={DATE_FILTERS} selected={dateFilter} onSelect={(option) => setDateFilter(option as (typeof DATE_FILTERS)[number])} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetRow}>
          {assets.map((asset) => (
            <Pressable
              key={asset}
              style={[styles.assetChip, assetFilter === asset && styles.assetChipActive]}
              onPress={() => setAssetFilter(asset)}
            >
              <Text style={[styles.assetLabel, assetFilter === asset && styles.assetLabelActive]}>{asset}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {activities.length === 0 ? (
        <View style={{ marginTop: 80 }}>
          <Skeleton height={80} />
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
          ListEmptyComponent={
            <View style={{ padding: 32 }}>
              <Text style={styles.emptyText}>No matching history for selected filters.</Text>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        />
      )}
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
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportLabel: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  analyticsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111927',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsColumn: {
    alignItems: 'flex-start',
  },
  analyticsLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  analyticsValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filters: {
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  assetRow: {
    gap: 8,
  },
  assetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1F2937',
  },
  assetChipActive: {
    backgroundColor: '#2563EB',
  },
  assetLabel: {
    color: '#9CA3AF',
  },
  assetLabelActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowCenter: {
    flex: 1,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rowSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowAmount: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  amountNegative: {
    color: '#F87171',
    fontWeight: '600',
  },
  amountPositive: {
    color: '#34D399',
    fontWeight: '600',
  },
  amountMuted: {
    color: '#9CA3AF',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default HistoryScreen;

