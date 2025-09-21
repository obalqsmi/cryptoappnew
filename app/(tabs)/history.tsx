/**
 * History Screen: Displays a list of the user's past activities.
 * It shows transactions like swaps, transfers, and staking activities,
 * allowing the user to filter them by category and view their status.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Appearance, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Empty from '../../components/Empty';
import Segmented from '../../components/Segmented';
import { formatCompact } from '../../services/formatting';
import { useAppStore } from '../../state/appStore';
import { usePortfolioStore } from '../../state/portfolioStore';
import { Activity } from '../../types/market';

dayjs.extend(localizedFormat);

const FILTERS = ['All', 'Transfers', 'Swaps', 'Earn'] as const;
type FilterOption = (typeof FILTERS)[number];

const FILTER_ACTIVITY_MAP: Record<FilterOption, Activity['type'][]> = {
  All: ['swap', 'send', 'receive', 'stake'],
  Transfers: ['send', 'receive'],
  Swaps: ['swap'],
  Earn: ['stake'],
};

const formatAddress = (address?: string) => {
  if (!address) {
    return 'Unknown';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  switch (type) {
    case 'swap':
      return <MaterialCommunityIcons name="swap-horizontal-bold" size={24} color="#2F80ED" />;
    case 'send':
      return <Ionicons name="arrow-up-circle" size={24} color="#EF4444" />;
    case 'receive':
      return <Ionicons name="arrow-down-circle" size={24} color="#1DB954" />;
    case 'stake':
      return <MaterialCommunityIcons name="lock" size={24} color="#9333ea" />;
    default:
      return <Ionicons name="help-circle" size={24} color="#6B768A" />;
  }
};

const ActivityItem = ({ item, isDarkMode }: { item: Activity; isDarkMode: boolean }) => {
  const styles = getStyles(isDarkMode);
  let title = 'Transaction';
  let details = '';
  let amountDisplay = <Text style={styles.amountZero}>-</Text>;

  switch (item.type) {
    case 'swap':
      title = 'Swap';
      details = `${item.from.symbol} → ${item.to.symbol}`;
      amountDisplay = (
        <Text style={styles.amountPrimary}>
          {formatCompact(item.to.amount)} {item.to.symbol}
        </Text>
      );
      break;
    case 'send': {
      const symbol = item.from.symbol.toUpperCase();
      title = `Send ${symbol}`;
      details = `To: ${formatAddress(item.to.address)}`;
      amountDisplay = (
        <Text style={styles.amountNegative}>
          - {formatCompact(item.from.amount)} {symbol}
        </Text>
      );
      break;
    }
    case 'receive': {
      const symbol = item.to.symbol.toUpperCase();
      title = `Receive ${symbol}`;
      details = `From: ${formatAddress(item.from.address)}`;
      amountDisplay = (
        <Text style={styles.amountPositive}>
          + {formatCompact(item.to.amount)} {symbol}
        </Text>
      );
      break;
    }
    case 'stake': {
      const symbol = item.from.symbol.toUpperCase();
      title = `Stake ${symbol}`;
      details = `Validator: ${formatAddress(item.to.validator)}`;
      amountDisplay = (
        <Text style={styles.amountMuted}>
          {formatCompact(item.from.amount)} {symbol}
        </Text>
      );
      break;
    }
  }

  return (
    <View style={styles.row}>
      <ActivityIcon type={item.type} />
      <View style={styles.rowCenter}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{details}</Text>
      </View>
      <View style={styles.rowRight}>
        {amountDisplay}
        <Text style={styles.rowSubtitle}>{dayjs(item.date).format('MMM D, h:mm A')}</Text>
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { activities } = usePortfolioStore();
  const { theme } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterOption>(FILTERS[0]);
  
  const colorScheme = theme === 'system' ? Appearance.getColorScheme() : theme;
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'All') {
      return activities;
    }
    const filterTypes = FILTER_ACTIVITY_MAP[activeFilter];
    return activities.filter((a) => filterTypes.includes(a.type));
  }, [activities, activeFilter]);

  const sections = useMemo(() => {
    const grouped = filteredActivities.reduce((acc, activity) => {
      const date = dayjs(activity.date).format('MMMM D, YYYY');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, Activity[]>);

    return Object.keys(grouped).map((date) => ({
      title: date,
      data: grouped[date],
    }));
  }, [filteredActivities]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 16, marginTop: 8 }}>
        <Segmented
          options={FILTERS}
          selected={activeFilter}
          onSelect={(option) => setActiveFilter(option as FilterOption)}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityItem item={item} isDarkMode={isDarkMode} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={
          <Empty
            message="No activities yet."
            actionTitle="Make a Swap"
            onAction={() => router.push('/(tabs)/trade')}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0B1220' : '#F6F8FC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: isDarkMode ? '#FFFFFF' : '#0B1220',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingVertical: 8,
    color: isDarkMode ? '#6B768A' : '#687385',
    fontWeight: '600',
    backgroundColor: isDarkMode ? '#0B1220' : '#F6F8FC',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  rowCenter: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    color: isDarkMode ? '#E6ECF5' : '#0B1220',
    fontWeight: '600',
    fontSize: 16,
  },
  rowSubtitle: {
    color: isDarkMode ? '#6B768A' : '#687385',
    fontSize: 13,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  amountPrimary: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  amountPositive: {
    color: '#1DB954',
    fontWeight: '600',
  },
  amountNegative: {
    color: '#EF4444',
    fontWeight: '600',
  },
  amountZero: {
    color: isDarkMode ? '#6B768A' : '#687385',
    fontWeight: '600',
  },
  amountMuted: {
    color: isDarkMode ? '#a1a1aa' : '#71717a',
    fontWeight: '600',
  },
});

