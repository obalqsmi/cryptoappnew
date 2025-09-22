import * as Clipboard from 'expo-clipboard';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';

type QRCodeHandle = {
  toDataURL?: (callback: (data: string) => void) => void;
};

interface WalletQrModalProps {
  visible: boolean;
  address: string;
  onClose: () => void;
}

const WalletQrModal: React.FC<WalletQrModalProps> = ({ visible, address, onClose }) => {
  const qrRef = useRef<QRCodeHandle | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);

  const handleCopy = () => {
    Clipboard.setStringAsync(address);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const handleShare = async () => {
    try {
      const dataURL = await new Promise<string | null>((resolve) => {
        const generator = qrRef.current?.toDataURL;
        if (!generator) {
          resolve(null);
          return;
        }
        generator((value: string) => resolve(value));
      });
      if (!dataURL) return;
      if (!cacheDirectory) {
        Alert.alert('Share unavailable', 'Storage directory is not accessible.');
        return;
      }
      const filename = `${cacheDirectory}wallet-qr.png`;
      await writeAsStringAsync(filename, dataURL, { encoding: 'base64' });
      await Sharing.shareAsync(filename);
    } catch (error) {
      console.error('Share QR failed', error);
    }
  };

  const handleScan = ({ data }: BarCodeScannerResult) => {
    setScannedAddress(data);
    setScannerVisible(false);
    Alert.alert('Address scanned', data);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Wallet QR Code</Text>
          <QRCode
            value={address}
            size={200}
            backgroundColor="#0B1220"
            color="#FFFFFF"
            getRef={(ref) => {
              qrRef.current = ref as QRCodeHandle | null;
            }}
          />
          <Text style={styles.address}>{address}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={handleCopy}>
              <Text style={styles.buttonLabel}>Copy</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleShare}>
              <Text style={styles.buttonLabel}>Share</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => setScannerVisible(true)}>
              <Text style={styles.buttonLabel}>Scan</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.closeButton]} onPress={onClose}>
              <Text style={styles.buttonLabel}>Close</Text>
            </Pressable>
          </View>
          {scannedAddress ? <Text style={styles.scannedLabel}>Last scanned: {scannedAddress}</Text> : null}
        </View>
      </View>
      {scannerVisible && (
        <Modal transparent animationType="fade" visible={scannerVisible}>
          <View style={styles.scannerOverlay}>
            <BarCodeScanner onBarCodeScanned={handleScan} style={styles.scannerView} />
            <Pressable style={styles.scannerClose} onPress={() => setScannerVisible(false)}>
              <Text style={styles.buttonLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    padding: 24,
    alignItems: 'center',
    gap: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  address: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  scannedLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  closeButton: {
    backgroundColor: '#1F2937',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerView: {
    width: '100%',
    height: '100%',
  },
  scannerClose: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
});

export default WalletQrModal;

