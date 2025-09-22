import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency, formatPercent } from '../services/formatting';
import { Currency } from '../types/market';

interface BalanceCardProps {
  totalValue: number;
  pnlValue: number;
  pnlPercent: number;
  currency: Currency;
  secondaryCurrencies: Currency[];
  onSelectTimeframe: (frame: '24h' | '7d' | 'all') => void;
  activeTimeframe: '24h' | '7d' | 'all';
  onShare: () => void;
  onShowQr: () => void;
  onDeveloperShortcut: () => void;
  forceHidden?: boolean;
}

const TIMEFRAME_OPTIONS: { label: string; value: '24h' | '7d' | 'all' }[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: 'ALL', value: 'all' },
];

const conversionRates: Record<Currency, Record<Currency, number>> = {
  USD: { USD: 1, EUR: 0.92, AED: 3.67 },
  EUR: { USD: 1.08, EUR: 1, AED: 3.98 },
  AED: { USD: 0.27, EUR: 0.25, AED: 1 },
};

const BalanceCard: React.FC<BalanceCardProps> = ({
  totalValue,
  pnlValue,
  pnlPercent,
  currency,
  secondaryCurrencies,
  onSelectTimeframe,
  activeTimeframe,
  onShare,
  onShowQr,
  onDeveloperShortcut,
  forceHidden,
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [lastUpdated] = useState(dayjs());
  const tapCount = useRef({ count: 0, timestamp: 0 });
  const isPositive = pnlValue >= 0;
  const hidden = forceHidden ?? isHidden;

  const conversions = useMemo(() => {
    return secondaryCurrencies
      .filter((c) => c !== currency)
      .map((target) => {
        const rate = conversionRates[currency]?.[target] ?? 1;
        return {
          currency: target,
          value: totalValue * rate,
        };
      });
  }, [secondaryCurrencies, currency, totalValue]);

  const handleEyePress = () => {
    const now = Date.now();
    if (now - tapCount.current.timestamp < 400) {
      tapCount.current.count += 1;
    } else {
      tapCount.current.count = 1;
    }
    tapCount.current.timestamp = now;

    if (tapCount.current.count >= 3) {
      onDeveloperShortcut();
      tapCount.current.count = 0;
    } else {
      setIsHidden((prev) => !prev);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Total Balance</Text>
          <Text style={styles.balance}>
            {hidden ? '••••••••' : formatCurrency(totalValue, currency)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={handleEyePress}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={24} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={onShare}>
            <Ionicons name="share-outline" size={24} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={onShowQr}>
            <MaterialCommunityIcons name="qrcode" size={24} color="#9CA3AF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.pnlContainer}>
        <Text style={[styles.pnlValue, { color: isPositive ? '#1DB954' : '#EF4444' }]}> 
          {isPositive ? '+' : '-'}
          {hidden ? '•••' : formatCurrency(Math.abs(pnlValue), currency)}
        </Text>
        <Text style={[styles.pnlPercent, { color: isPositive ? '#1DB954' : '#EF4444' }]}> 
          ({hidden ? '•.••%' : formatPercent(pnlPercent)})
        </Text>
      </View>

      <View style={styles.timeframeContainer}>
        {TIMEFRAME_OPTIONS.map((option) => {
          const active = activeTimeframe === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.timeframeChip, active && styles.timeframeChipActive]}
              onPress={() => onSelectTimeframe(option.value)}
            >
              <Text style={[styles.timeframeLabel, active && styles.timeframeLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {conversions.length > 0 && (
        <View style={styles.conversions}>
          {conversions.map((conversion) => (
            <View key={conversion.currency} style={styles.conversionPill}>
              <Text style={styles.conversionLabel}>{conversion.currency}</Text>
              <Text style={styles.conversionValue}>
                {hidden ? '••••' : formatCurrency(conversion.value, conversion.currency)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Updated {lastUpdated.format('HH:mm')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111927',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  balance: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 34,
    marginTop: 4,
  },
  pnlContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pnlValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  pnlPercent: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  timeframeChipActive: {
    backgroundColor: '#2F80ED',
    borderColor: '#2F80ED',
  },
  timeframeLabel: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 13,
  },
  timeframeLabelActive: {
    color: '#FFFFFF',
  },
  conversions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conversionPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  conversionLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  conversionValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
  },
});

export default BalanceCard;

