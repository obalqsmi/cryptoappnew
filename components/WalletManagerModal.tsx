import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppStore } from '../state/store';

interface WalletManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

const WalletManagerModal: React.FC<WalletManagerModalProps> = ({ visible, onClose }) => {
  const {
    wallets,
    activeWalletId,
    switchWallet,
    addWallet,
    importWallet,
    addWatchWallet,
    exportSeedPhrase,
  } = useAppStore((state) => ({
    wallets: state.wallets,
    activeWalletId: state.activeWalletId,
    switchWallet: state.switchWallet,
    addWallet: state.addWallet,
    importWallet: state.importWallet,
    addWatchWallet: state.addWatchWallet,
    exportSeedPhrase: state.exportSeedPhrase,
  }));

  const [newWalletName, setNewWalletName] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [watchAddress, setWatchAddress] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Wallets</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {wallets.map((wallet) => (
              <Pressable
                key={wallet.id}
                style={[styles.walletItem, wallet.id === activeWalletId && styles.walletItemActive]}
                onPress={() => switchWallet(wallet.id)}
              >
                <View>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletMeta}>
                    {wallet.type.toUpperCase()} • {wallet.holdings.length} assets
                  </Text>
                </View>
                {wallet.id === activeWalletId && <Text style={styles.badge}>Active</Text>}
              </Pressable>
            ))}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Wallet</Text>
              <TextInput
                placeholder="Wallet name"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={newWalletName}
                onChangeText={setNewWalletName}
              />
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  addWallet(newWalletName || 'New Wallet');
                  setNewWalletName('');
                }}
              >
                <Text style={styles.primaryLabel}>Create Wallet</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Import Seed Phrase</Text>
              <TextInput
                placeholder="Enter seed phrase"
                placeholderTextColor="#6B7280"
                style={[styles.input, { height: 80 }]}
                value={seedPhrase}
                onChangeText={setSeedPhrase}
                multiline
              />
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  if (seedPhrase.trim().length > 0) {
                    importWallet(seedPhrase.trim());
                    setSeedPhrase('');
                  }
                }}
              >
                <Text style={styles.primaryLabel}>Import</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Watch-only Wallet</Text>
              <TextInput
                placeholder="Public address"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={watchAddress}
                onChangeText={setWatchAddress}
              />
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  if (watchAddress.trim().length > 0) {
                    addWatchWallet(watchAddress.trim());
                    setWatchAddress('');
                  }
                }}
              >
                <Text style={styles.primaryLabel}>Add Watch Wallet</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seed Backup</Text>
              {wallets
                .filter((wallet) => wallet.seedPhrase)
                .map((wallet) => (
                  <Pressable
                    key={wallet.id}
                    style={styles.exportButton}
                    onPress={() => {
                      const phrase = exportSeedPhrase(wallet.id);
                      if (phrase) {
                        setSeedPhrase(phrase);
                      }
                    }}
                  >
                    <Text style={styles.exportLabel}>Reveal seed for {wallet.name}</Text>
                  </Pressable>
                ))}
              {seedPhrase.length > 0 && <Text style={styles.seedDisplay}>{seedPhrase}</Text>}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0B1220',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    gap: 18,
  },
  walletItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111927',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletItemActive: {
    borderColor: '#2563EB',
  },
  walletName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  walletMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  badge: {
    color: '#2563EB',
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  exportButton: {
    paddingVertical: 10,
  },
  exportLabel: {
    color: '#60A5FA',
  },
  seedDisplay: {
    color: '#F9FAFB',
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    fontStyle: 'italic',
  },
});

export default WalletManagerModal;

