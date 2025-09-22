import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Segmented from '../../components/Segmented';
import Sheet from '../../components/Sheet';
import { formatCurrency } from '../../services/formatting';
import { fetchTopTokens } from '../../services/prices';
import { useAppStore } from '../../state/store';
import { useActiveWallet, usePortfolioValue, useSwapAnalytics } from '../../state/portfolioStore';
import { Holding, Token } from '../../types/market';

const NETWORKS = ['Ethereum', 'Solana', 'Cronos'] as const;
const SLIPPAGE_OPTIONS = ['0.1%', '0.5%', '1%'] as const;
const SPEED_OPTIONS = ['cheap', 'normal', 'fast'] as const;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type NetworkOption = (typeof NETWORKS)[number];

type SpeedOption = 'cheap' | 'normal' | 'fast';

const TradeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const {
    currency,
    tokens,
    recordSwap,
    toggleFavoritePair,
    upsertAutoSwapRule,
    toggleAutoSwapRule,
    sandboxMode,
    toggleSandboxMode,
    transactionSpeed,
    setTransactionSpeed,
  } = useAppStore((state) => ({
    currency: state.currency,
    tokens: state.tokens,
    recordSwap: state.recordSwap,
    toggleFavoritePair: state.toggleFavoritePair,
    upsertAutoSwapRule: state.upsertAutoSwapRule,
    toggleAutoSwapRule: state.toggleAutoSwapRule,
    sandboxMode: state.sandboxMode,
    toggleSandboxMode: state.toggleSandboxMode,
    transactionSpeed: state.transactionSpeed,
    setTransactionSpeed: state.setTransactionSpeed,
  }));

  const activeWallet = useActiveWallet();
  const holdings = activeWallet.holdings;
  const portfolioValue = usePortfolioValue();
  const swapAnalytics = useSwapAnalytics();

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [network, setNetwork] = useState<NetworkOption>(NETWORKS[0]);
  const [slippage, setSlippage] = useState<(typeof SLIPPAGE_OPTIONS)[number]>(SLIPPAGE_OPTIONS[1]);
  const [isFromSheetVisible, setFromSheetVisible] = useState(false);
  const [isToSheetVisible, setToSheetVisible] = useState(false);
  const [isConfirmSheetVisible, setConfirmSheetVisible] = useState(false);
  const [ruleAmount, setRuleAmount] = useState('10');
  const [ruleDay, setRuleDay] = useState(0);

  useEffect(() => {
    if (!tokens.length) {
      fetchTopTokens(currency);
    }
  }, [currency, tokens.length]);

  useEffect(() => {
    if (!tokens.length) return;
    const initialFrom = params.from ? tokens.find((t) => t.id === params.from) : tokens[0];
    const initialTo = tokens.find((t) => t.id !== initialFrom?.id);
    setFromToken(initialFrom ?? tokens[0]);
    setToToken(initialTo ?? tokens[1]);
  }, [tokens, params.from]);

  const fromBalance = useMemo(() => holdings.find((h) => h.id === fromToken?.id)?.amount ?? 0, [holdings, fromToken]);

  const toAmount = useMemo(() => {
    if (!fromToken || !toToken) return '0.00';
    const input = Number(fromAmount);
    if (!input || toToken.current_price === 0) return '0.00';
    const raw = (input * fromToken.current_price) / toToken.current_price;
    const slip = Number(slippage.replace('%', '')) / 100;
    const adjusted = raw * (1 - slip);
    return adjusted.toFixed(6);
  }, [fromToken, toToken, fromAmount, slippage]);

  const gasEstimate = useMemo(() => {
    const baseFee = network === 'Ethereum' ? 12 : network === 'Solana' ? 0.25 : 0.9;
    const multiplier = transactionSpeed === 'fast' ? 1.4 : transactionSpeed === 'cheap' ? 0.6 : 1;
    return formatCurrency(baseFee * multiplier, 'USD');
  }, [network, transactionSpeed]);

  const favoritePair = `${fromToken?.symbol ?? ''}/${toToken?.symbol ?? ''}`;
  const isFavorite = activeWallet.favoritePairs.includes(favoritePair);

  const handleReviewSwap = () => {
    if (!fromToken || !toToken) return;
    const amount = Number(fromAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter the amount you wish to swap.');
      return;
    }
    if (amount > fromBalance) {
      Alert.alert('Insufficient balance', `You only hold ${fromBalance.toFixed(4)} ${fromToken.symbol}.`);
      return;
    }
    setConfirmSheetVisible(true);
  };

  const confirmSwap = () => {
    if (!fromToken || !toToken) return;
    const amount = Number(fromAmount);
    const received = Number(toAmount);
    if (!amount || !received) return;
    const fromHolding: Holding = { id: fromToken.id, symbol: fromToken.symbol, amount };
    const toHolding: Holding = { id: toToken.id, symbol: toToken.symbol, amount: received };
    recordSwap(activeWallet.id, fromHolding, toHolding);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleFavoritePair(favoritePair);
    setConfirmSheetVisible(false);
    setFromAmount('');
    Alert.alert('Swap Complete', `${amount} ${fromToken.symbol} → ${received} ${toToken.symbol}`);
  };

  const saveAutoSwapRule = () => {
    if (!fromToken || !toToken) return;
    const amount = Number(ruleAmount);
    if (!amount) return;
    upsertAutoSwapRule(activeWallet.id, {
      id: `${fromToken.id}-${toToken.id}-${ruleDay}`,
      fromAsset: fromToken.id,
      toAsset: toToken.id,
      amount,
      frequency: 'weekly',
      dayOfWeek: ruleDay,
      enabled: true,
      nextRun: new Date().toISOString(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderTokenSelector = (token: Token | null, onPress: () => void, label: string, balance?: number) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.tokenPill} onPress={onPress}>
          {token?.image ? <Image source={{ uri: token.image }} style={styles.tokenImage} /> : null}
          <Text style={styles.tokenSymbol}>{token?.symbol ?? 'Select'}</Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
        </Pressable>
        {label === 'You Pay' ? (
          <TextInput
            style={styles.amountInput}
            value={fromAmount}
            onChangeText={setFromAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#6B7280"
          />
        ) : (
          <Text style={styles.amountOutput}>{toAmount}</Text>
        )}
      </View>
      {balance !== undefined && <Text style={styles.balanceText}>Balance: {balance.toFixed(4)}</Text>}
    </View>
  );

  const renderSheet = (visible: boolean, onClose: () => void, onSelect: (token: Token) => void, title: string) => (
    <Sheet isVisible={visible} onClose={onClose} title={title}>
      <ScrollView style={{ maxHeight: 360 }}>
        {tokens.map((token) => (
          <Pressable key={token.id} style={styles.sheetItem} onPress={() => { onSelect(token); onClose(); }}>
            <Text style={styles.sheetSymbol}>{token.symbol.toUpperCase()}</Text>
            <Text style={styles.sheetName}>{token.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Sheet>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Smart Swap</Text>
        <Pressable style={styles.favoriteButton} onPress={() => toggleFavoritePair(favoritePair)}>
          <MaterialCommunityIcons name={isFavorite ? 'star' : 'star-outline'} size={22} color="#FACC15" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Sandbox mode</Text>
            <Pressable onPress={toggleSandboxMode} style={[styles.toggle, sandboxMode && styles.toggleActive]}>
              <Text style={styles.toggleLabel}>{sandboxMode ? 'On' : 'Off'}</Text>
            </Pressable>
          </View>
          <Segmented options={NETWORKS} selected={network} onSelect={(option) => setNetwork(option as NetworkOption)} />
          <Segmented options={SPEED_OPTIONS.map((s) => s.toUpperCase())} selected={transactionSpeed.toUpperCase()} onSelect={(opt) => setTransactionSpeed(opt.toLowerCase() as SpeedOption)} />

          {renderTokenSelector(fromToken, () => setFromSheetVisible(true), 'You Pay', fromBalance)}
          <Pressable style={styles.swapSwitch} onPress={() => { const prev = fromToken; setFromToken(toToken); setToToken(prev); }}>
            <Ionicons name="swap-vertical" size={24} color="#60A5FA" />
          </Pressable>
          {renderTokenSelector(toToken, () => setToSheetVisible(true), 'You Receive')}

          <Text style={styles.label}>Slippage Control</Text>
          <Segmented options={SLIPPAGE_OPTIONS} selected={slippage} onSelect={(option) => setSlippage(option as typeof SLIPPAGE_OPTIONS[number])} />

          <View style={styles.infoBox}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Gas Estimate</Text><Text style={styles.infoValue}>{gasEstimate}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Portfolio Value</Text><Text style={styles.infoValue}>{formatCurrency(portfolioValue, currency)}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Swap Volume</Text><Text style={styles.infoValue}>{formatCurrency(swapAnalytics.totalVolume, currency)}</Text></View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleReviewSwap}>
            <Text style={styles.primaryLabel}>Review Swap</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recurring Auto Swap</Text>
          <TextInput
            style={styles.input}
            value={ruleAmount}
            onChangeText={setRuleAmount}
            keyboardType="numeric"
            placeholder="Amount"
            placeholderTextColor="#6B7280"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DAYS.map((day, index) => (
              <Pressable
                key={day}
                style={[styles.dayChip, ruleDay === index && styles.dayChipActive]}
                onPress={() => setRuleDay(index)}
              >
                <Text style={[styles.dayLabel, ruleDay === index && styles.dayLabelActive]}>{day}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.secondaryButton} onPress={saveAutoSwapRule}>
            <Text style={styles.secondaryLabel}>Schedule Weekly Swap</Text>
          </Pressable>

          {activeWallet.autoSwapRules.map((rule) => (
            <View key={rule.id} style={styles.ruleItem}>
              <View>
                <Text style={styles.ruleTitle}>{rule.fromAsset} → {rule.toAsset}</Text>
                <Text style={styles.ruleMeta}>Every {DAYS[rule.dayOfWeek ?? 0]} • {rule.amount}</Text>
              </View>
              <Pressable onPress={() => toggleAutoSwapRule(activeWallet.id, rule.id)}>
                <MaterialCommunityIcons name={rule.enabled ? 'toggle-switch' : 'toggle-switch-off'} size={28} color={rule.enabled ? '#34D399' : '#9CA3AF'} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {renderSheet(isFromSheetVisible, () => setFromSheetVisible(false), setFromToken, 'Select asset to pay')}
      {renderSheet(isToSheetVisible, () => setToSheetVisible(false), setToToken, 'Select asset to receive')}

      <Sheet isVisible={isConfirmSheetVisible} onClose={() => setConfirmSheetVisible(false)} title="Confirm Swap">
        <View style={styles.confirmCard}>
          <Text style={styles.confirmText}>{fromAmount || 0} {fromToken?.symbol} → {toAmount} {toToken?.symbol}</Text>
          <Text style={styles.confirmSub}>Slippage {slippage} • Speed {transactionSpeed.toUpperCase()}</Text>
          <Pressable style={styles.primaryButton} onPress={confirmSwap}>
            <Text style={styles.primaryLabel}>Execute Swap</Text>
          </Pressable>
        </View>
      </Sheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111927',
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#111927',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1F2937',
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tokenImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    textAlign: 'right',
    color: '#FFFFFF',
    fontSize: 18,
  },
  amountOutput: {
    flex: 1,
    textAlign: 'right',
    color: '#34D399',
    fontSize: 18,
  },
  balanceText: {
    color: '#6B7280',
    fontSize: 12,
  },
  swapSwitch: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(96,165,250,0.12)',
  },
  infoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#9CA3AF',
  },
  infoValue: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#111927',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1F2937',
  },
  dayChipActive: {
    backgroundColor: '#2563EB',
  },
  dayLabel: {
    color: '#9CA3AF',
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
  },
  ruleTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ruleMeta: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  sheetItem: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetSymbol: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sheetName: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  confirmCard: {
    padding: 20,
    gap: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmSub: {
    color: '#9CA3AF',
  },
});

export default TradeScreen;

