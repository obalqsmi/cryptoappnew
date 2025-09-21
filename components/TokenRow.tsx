/**
 * TokenRow Component: A list item for displaying a single cryptocurrency.
 * It shows the token's icon, name, symbol, current price, 24-hour percentage change,
 * and a sparkline chart for a quick visual trend. It's pressable to navigate to details.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatPercent } from '../services/formatting';
import { Currency, Token } from '../types/market';
import Sparkline from './Sparkline';

type TokenRowProps = {
  token: Token;
  currency: Currency;
  onPress?: () => void;
};

const TokenRow = ({ token, currency, onPress }: TokenRowProps) => {
  const router = useRouter();
  const isPositive = token.price_change_percentage_24h >= 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if(onPress) {
        onPress();
    } else {
        // Default navigation if no custom handler
        router.push({ pathname: '/(tabs)/market' }); // Could be a detail screen later
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Image source={{ uri: token.image }} style={styles.icon} />
      <View style={styles.nameContainer}>
        <Text style={styles.symbol}>{token.symbol.toUpperCase()}</Text>
        <Text style={styles.name}>{token.name}</Text>
      </View>
      <View style={styles.chartContainer}>
        <Sparkline data={token.sparkline_in_7d.price} isPositive={isPositive}/>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{formatCurrency(token.current_price, currency)}</Text>
        <Text style={[styles.change, { color: isPositive ? '#1DB954' : '#EF4444' }]}>
          {formatPercent(token.price_change_percentage_24h / 100)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6B768A" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#111927',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1.5,
  },
  symbol: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  name: {
    color: '#6B768A',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  priceContainer: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  price: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  change: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});

export default React.memo(TokenRow);
