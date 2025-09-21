/**
 * Trade Screen: A swap simulator.
 * Users can select tokens to swap, input an amount, and review the transaction
 * details like estimated output and fees. Confirming the swap updates their
 * portfolio and records the activity.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Sheet from '../../components/Sheet';
import { formatCurrency } from '../../services/formatting';
import { fetchTopTokens } from '../../services/prices';
import { useAppStore } from '../../state/appStore';
import { usePortfolioStore } from '../../state/portfolioStore';
import { Holding, Token } from '../../types/market';

const NETWORKS = ['Ethereum', 'Solana', 'Cronos'];

export default function TradeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { currency } = useAppStore();
  const { holdings, recordSwap } = usePortfolioStore();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [isFromSheetVisible, setFromSheetVisible] = useState(false);
  const [isToSheetVisible, setToSheetVisible] = useState(false);
  const [isConfirmSheetVisible, setConfirmSheetVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedTokens = await fetchTopTokens(currency);
        setTokens(fetchedTokens);
        if (params.from) {
          const prefill = fetchedTokens.find(t => t.id === params.from);
          if (prefill) setFromToken(prefill);
        } else if (holdings.length > 0) {
           const prefill = fetchedTokens.find(t => t.id === holdings[0].id);
           if (prefill) setFromToken(prefill);
        } else if (fetchedTokens.length > 0) {
          setFromToken(fetchedTokens[0]);
        }

        if(fetchedTokens.length > 1) {
            setToToken(fetchedTokens[1]);
        }
      } catch (error) {
        console.error('Failed to load tokens for trade:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currency, params.from, holdings]);

  const fromBalance = useMemo(() => holdings.find(h => h.id === fromToken?.id)?.amount ?? 0, [holdings, fromToken]);

  const toAmount = useMemo(() => {
    if (!fromToken || !toToken || !fromAmount) return '0.00';
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || toToken.current_price === 0) return '0.00';
    const result = (amount * fromToken.current_price) / toToken.current_price;
    return result.toFixed(6);
  }, [fromToken, toToken, fromAmount]);

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert("Invalid Swap", "Please check your inputs.");
      return;
    }
    if(parseFloat(fromAmount) > fromBalance){
      Alert.alert("Insufficient Balance", `You only have ${fromBalance} ${fromToken.symbol}.`);
      return;
    }
    setConfirmSheetVisible(true);
  };
  
  const confirmSwap = () => {
    if (!fromToken || !toToken || !fromAmount) return;
    const fromHolding: Holding = { id: fromToken.id, symbol: fromToken.symbol, amount: parseFloat(fromAmount) };
    const toHolding: Holding = { id: toToken.id, symbol: toToken.symbol, amount: parseFloat(toAmount) };

    recordSwap(fromHolding, toHolding);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmSheetVisible(false);
    setFromAmount('');
    Alert.alert("Swap Successful!", `${fromAmount} ${fromToken.symbol} has been swapped for ${toAmount} ${toToken.symbol}.`);
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" />
      </SafeAreaView>
    );
  }

  const renderTokenSelector = (
    token: Token | null,
    onPress: () => void,
    label: string,
    balance?: number
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Pressable style={styles.tokenPill} onPress={onPress}>
          <Text style={styles.tokenSymbol}>{token?.symbol ?? 'Select'}</Text>
          <Ionicons name="chevron-down" size={16} color="#FFF" />
        </Pressable>
        {label === 'You Pay' ? (
             <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#6B768A"
                keyboardType="numeric"
                value={fromAmount}
                onChangeText={setFromAmount}
            />
        ) : (
            <Text style={styles.amountOutput}>{toAmount}</Text>
        )}
      </View>
      {balance !== undefined && (
          <Text style={styles.balanceText}>Balance: {balance.toFixed(4)}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Swap</Text>
        <View style={{width: 24}}/>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
            <View style={{alignItems: 'center', marginBottom: 20}}>
                <Segmented options={NETWORKS} selected={network} onSelect={setNetwork} />
            </View>

            {renderTokenSelector(fromToken, () => setFromSheetVisible(true), 'You Pay', fromBalance)}
            
            <View style={styles.swapIconContainer}>
                <Pressable onPress={() => { setFromToken(toToken); setToToken(fromToken); }}>
                    <Ionicons name="swap-vertical" size={24} color="#2F80ED" />
                </Pressable>
            </View>
            
            {renderTokenSelector(toToken, () => setToSheetVisible(true), 'You Receive')}

            <View style={styles.infoBox}>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Price Impact</Text><Text style={styles.infoValue}>~0.00%</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Est. Network Fee</Text><Text style={styles.infoValue}>$1.25</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Other Fees</Text><Text style={styles.infoValue}>$0.00</Text></View>
            </View>

            <Pressable style={styles.swapButton} onPress={handleSwap}>
                <Text style={styles.swapButtonText}>Review Swap</Text>
            </Pressable>
        </View>
      </ScrollView>

      {/* Token selection sheets */}
      <Sheet isVisible={isFromSheetVisible} onClose={() => setFromSheetVisible(false)} title="Select Token (Pay)">
        {tokens.map(t => (
            <Pressable key={t.id} style={styles.sheetItem} onPress={() => { setFromToken(t); setFromSheetVisible(false); }}>
                <Text style={styles.sheetItemText}>{t.name} ({t.symbol})</Text>
            </Pressable>
        ))}
      </Sheet>
      <Sheet isVisible={isToSheetVisible} onClose={() => setToSheetVisible(false)} title="Select Token (Receive)">
         {tokens.map(t => (
            <Pressable key={t.id} style={styles.sheetItem} onPress={() => { setToToken(t); setToSheetVisible(false); }}>
                <Text style={styles.sheetItemText}>{t.name} ({t.symbol})</Text>
            </Pressable>
        ))}
      </Sheet>
      
      {/* Confirmation sheet */}
      <Sheet isVisible={isConfirmSheetVisible} onClose={() => setConfirmSheetVisible(false)} title="Confirm Swap">
        <View style={styles.confirmContent}>
          <Text style={styles.confirmText}>You are swapping</Text>
          <Text style={styles.confirmAmount}>{fromAmount} {fromToken?.symbol}</Text>
          <Text style={styles.confirmText}>for approximately</Text>
          <Text style={styles.confirmAmount}>{toAmount} {toToken?.symbol}</Text>
          
          <View style={styles.confirmDetails}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Rate</Text><Text style={styles.infoValue}>1 {fromToken?.symbol} ≈ {(fromToken?.current_price ?? 0) / (toToken?.current_price || 1)} {toToken?.symbol}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Total Value</Text><Text style={styles.infoValue}>{formatCurrency(parseFloat(fromAmount) * (fromToken?.current_price ?? 0), currency)}</Text></View>
          </View>
          
          <Pressable style={styles.confirmButton} onPress={confirmSwap}>
            <Text style={styles.swapButtonText}>Confirm Swap</Text>
          </Pressable>
        </View>
      </Sheet>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: '#FFF', fontSize: 20, fontFamily: 'Inter-Bold' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#111927', borderRadius: 16, padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#6B768A', fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F1626', borderRadius: 12 },
  tokenPill: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRightWidth: 1, borderRightColor: '#111927' },
  tokenSymbol: { color: '#FFF', fontFamily: 'Inter-Bold', fontSize: 16, marginRight: 8 },
  amountInput: { flex: 1, color: '#FFF', fontSize: 18, fontFamily: 'Inter-SemiBold', padding: 12, textAlign: 'right' },
  amountOutput: { flex: 1, color: '#FFF', fontSize: 18, fontFamily: 'Inter-SemiBold', padding: 12, textAlign: 'right' },
  balanceText: { color: '#6B768A', marginTop: 6, textAlign: 'right' },
  swapIconContainer: { alignItems: 'center', marginVertical: -8, zIndex: 1, },
  infoBox: { marginTop: 20, padding: 12, backgroundColor: '#0F1626', borderRadius: 12, gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: '#6B768A', fontFamily: 'Inter-Regular' },
  infoValue: { color: '#FFF', fontFamily: 'Inter-SemiBold' },
  swapButton: { backgroundColor: '#2F80ED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  swapButtonText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter-Bold' },
  sheetItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A2333' },
  sheetItemText: { color: '#FFF', fontSize: 16 },
  confirmContent: { padding: 16, alignItems: 'center' },
  confirmText: { color: '#6B768A', fontSize: 16 },
  confirmAmount: { color: '#FFF', fontSize: 24, fontFamily: 'Inter-Bold', marginVertical: 8 },
  confirmDetails: { width: '100%', marginVertical: 20, gap: 10 },
  confirmButton: { backgroundColor: '#1DB954', borderRadius: 12, paddingVertical: 16, alignItems: 'center', width: '100%', marginTop: 10 },
});
