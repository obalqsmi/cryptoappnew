import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_NFTS = [
  { id: 'nft-1', name: 'Galactic Punk #420', collection: 'Galactic Punks', floor: 2.4, currency: 'SOL', image: 'https://images.unsplash.com/photo-1620325022783-123c0ffc2d92?auto=format&fit=crop&w=400&q=60' },
  { id: 'nft-2', name: 'Aurora Fragment', collection: 'Aurora', floor: 1.1, currency: 'ETH', image: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=400&q=60' },
  { id: 'nft-3', name: 'Voxel Ape', collection: 'Voxel Apes', floor: 0.9, currency: 'ETH', image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7f33d?auto=format&fit=crop&w=400&q=60' },
  { id: 'nft-4', name: 'Synth Samurai', collection: 'Neon Synth', floor: 3.6, currency: 'SOL', image: 'https://images.unsplash.com/photo-1604908177076-46c9f43a8f64?auto=format&fit=crop&w=400&q=60' },
];

const NftScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NFT Gallery</Text>
        <Text style={styles.headerSubtitle}>Mock collectibles in your wallet</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {MOCK_NFTS.map((nft) => (
          <View key={nft.id} style={styles.card}>
            <Image source={{ uri: nft.image }} style={styles.image} />
            <View style={styles.cardBody}>
              <Text style={styles.collection}>{nft.collection}</Text>
              <Text style={styles.name}>{nft.name}</Text>
              <Text style={styles.floor}>Floor: {nft.floor} {nft.currency}</Text>
              <Pressable style={styles.actionButton}>
                <Text style={styles.actionLabel}>List for sale</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 60,
    gap: 16,
  },
  card: {
    backgroundColor: '#111927',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  image: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  collection: {
    color: '#60A5FA',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  floor: {
    color: '#9CA3AF',
  },
  actionButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default NftScreen;

