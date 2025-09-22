import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '../../state/store';

interface DeveloperConsoleProps {
  visible: boolean;
  onClose: () => void;
}

const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({ visible, onClose }) => {
  const {
    sandboxMode,
    toggleSandboxMode,
    appendDebugLog,
    clearStorage,
    wallets,
    activeWalletId,
    updateHoldings,
    setTokens,
    tokens,
    debugLogs,
  } = useAppStore((state) => ({
    sandboxMode: state.sandboxMode,
    toggleSandboxMode: state.toggleSandboxMode,
    appendDebugLog: state.appendDebugLog,
    clearStorage: state.clearStorage,
    wallets: state.wallets,
    activeWalletId: state.activeWalletId,
    updateHoldings: state.updateHoldings,
    setTokens: state.setTokens,
    tokens: state.tokens,
    debugLogs: state.debugLogs,
  }));

  const activeWallet = wallets.find((w) => w.id === activeWalletId) ?? wallets[0];

  const handleAddFunds = (direction: 'add' | 'subtract') => {
    if (!activeWallet) return;
    const multiplier = direction === 'add' ? 1 : -1;
    const updated = activeWallet.holdings.map((holding) => ({
      ...holding,
      amount: Math.max(0, holding.amount + multiplier * 0.1),
    }));
    updateHoldings(activeWallet.id, updated);
    appendDebugLog(`${direction === 'add' ? 'Added' : 'Removed'} 0.1 units to each holding`);
  };

  const handleSeedCharts = () => {
    const seeded = tokens.map((token) => ({
      ...token,
      sparkline_in_7d: {
        price: token.sparkline_in_7d.price.map((price) => price * (0.95 + Math.random() * 0.1)),
      },
    }));
    setTokens(seeded);
    appendDebugLog('Seeded random sparkline data');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Developer Console</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Sandbox</Text>
            <Pressable style={styles.actionButton} onPress={toggleSandboxMode}>
              <Text style={styles.actionLabel}>{sandboxMode ? 'Disable Sandbox Mode' : 'Enable Sandbox Mode'}</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Wallet Tweaks</Text>
            <View style={styles.row}>
              <Pressable style={styles.smallButton} onPress={() => handleAddFunds('add')}>
                <Text style={styles.actionLabel}>+ Funds</Text>
              </Pressable>
              <Pressable style={styles.smallButton} onPress={() => handleAddFunds('subtract')}>
                <Text style={styles.actionLabel}>- Funds</Text>
              </Pressable>
            </View>

            <Pressable style={styles.actionButton} onPress={handleSeedCharts}>
              <Text style={styles.actionLabel}>Seed Random Chart Data</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                clearStorage();
                appendDebugLog('Cleared AsyncStorage from developer console');
              }}
            >
              <Text style={styles.actionLabel}>Clear AsyncStorage</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Debug Log</Text>
            {debugLogs.slice(-20).reverse().map((log, index) => (
              <Text key={index} style={styles.logEntry}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0B1120',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  logEntry: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default DeveloperConsole;

