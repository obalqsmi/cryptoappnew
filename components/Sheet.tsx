/**
 * Sheet Component: A reusable bottom sheet implemented with pure React Native components.
 * It provides a modal-like overlay that slides up from the bottom, perfect for
 * selection lists like picking a token, network, or currency.
 */
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetProps = {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const Sheet = ({ isVisible, onClose, title, children }: SheetProps) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
        </View>
        <ScrollView>{children}</ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111927',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  header: {
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  handle: {
      width: 40,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#6B768A',
      marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
});

export default Sheet;
