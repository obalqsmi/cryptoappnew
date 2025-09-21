/**
 * BalanceCard Component: A prominent card displaying the user's total portfolio value
 * and the 24-hour profit or loss in both absolute and percentage terms.
 * Includes a toggle to hide/show balances for privacy and a refresh button.
 */
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatPercent } from '../services/formatting';
import { Currency } from '../types/market';

type BalanceCardProps = {
  totalValue: number;
  pnlValue: number;
  pnlPercent: number;
  currency: Currency;
};

const BalanceCard = ({ totalValue, pnlValue, pnlPercent, currency }: BalanceCardProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const [lastUpdated] = useState(dayjs());
  const isPositive = pnlValue >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Balance</Text>
        <Pressable onPress={() => setIsHidden(!isHidden)}>
          <Ionicons name={isHidden ? 'eye-off-outline' : 'eye-outline'} size={24} color="#6B768A" />
        </Pressable>
      </View>

      <Text style={styles.balance}>
        {isHidden ? '••••••••' : formatCurrency(totalValue, currency)}
      </Text>

      <View style={styles.pnlContainer}>
        <Text style={[styles.pnlValue, { color: isPositive ? '#1DB954' : '#EF4444' }]}>
          {isPositive ? '+' : ''}
          {isHidden ? '•••' : formatCurrency(pnlValue, currency)}
        </Text>
        <Text style={[styles.pnlPercent, { color: isPositive ? '#1DB954' : '#EF4444' }]}>
          ({isHidden ? '•.••' : formatPercent(pnlPercent)})
        </Text>
        <Text style={styles.pnlTimeframe}>24h</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>Last updated: {lastUpdated.format('HH:mm')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111927',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#6B768A',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  balance: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  pnlValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  pnlPercent: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  pnlTimeframe: {
      color: '#6B768A',
      fontFamily: 'Inter-Regular',
      fontSize: 14,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      opacity: 0.7
  },
  lastUpdated: {
      color: '#6B768A',
      fontSize: 12,
      fontFamily: 'Inter-Regular'
  }
});

export default BalanceCard;
