import React, { PropsWithChildren, useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

import { useAppStore } from '../../state/store';
import PasscodePad from './PasscodePad';

const PASSCODE_LENGTH = 6;

const SecurityGate: React.FC<PropsWithChildren> = ({ children }) => {
  const {
    locked,
    lockOnBackground,
    biometricEnabled,
    unlock,
    lock,
    requireLock,
    verifyPasscode,
    setBiometricEnabled,
  } = useAppStore((state) => ({
    locked: state.locked,
    lockOnBackground: state.lockOnBackground,
    biometricEnabled: state.biometricEnabled,
    unlock: state.unlock,
    lock: state.lock,
    requireLock: state.requireLock,
    verifyPasscode: state.verifyPasscode,
    setBiometricEnabled: state.setBiometricEnabled,
  }));
  const [biometricAttempted, setBiometricAttempted] = useState(false);
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const passcodeConfigured = useAppStore((state) => Boolean(state.passcode));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && lockOnBackground) {
        lock();
      }
    });
    return () => subscription.remove();
  }, [lockOnBackground, lock]);

  useEffect(() => {
    if (!locked) {
      setDigits('');
      setError('');
      return;
    }

    (async () => {
      if (!biometricEnabled) {
        setBiometricAttempted(true);
        return;
      }
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        setBiometricEnabled(false);
        setBiometricAttempted(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your wallet',
        cancelLabel: 'Use passcode',
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        unlock();
      } else {
        setBiometricAttempted(true);
      }
    })();
  }, [locked, biometricEnabled, unlock, setBiometricEnabled]);

  useEffect(() => {
    // Lock on mount if required
    requireLock();
  }, [requireLock]);

  const handleSubmit = async () => {
    if (digits.length < 4) {
      setError('Enter 4-6 digits');
      return;
    }
    const ok = await verifyPasscode(digits);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDigits('');
      setError('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Incorrect passcode');
      setDigits('');
    }
  };

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Wallet Locked</Text>
            {biometricEnabled && !biometricAttempted && (
              <Text style={styles.subtitle}>Authenticating with biometrics…</Text>
            )}
            {(!biometricEnabled || biometricAttempted || !passcodeConfigured) && (
              <>
                <Text style={styles.subtitle}>
                  {passcodeConfigured ? 'Enter your passcode to continue' : 'Set a passcode in settings for quicker access'}
                </Text>
                <PasscodePad
                  digits={digits}
                  maxLength={PASSCODE_LENGTH}
                  onChange={setDigits}
                  onSubmit={handleSubmit}
                  error={error}
                />
                <Pressable onPress={handleSubmit} style={styles.button}>
                  <Text style={styles.buttonLabel}>Unlock</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 12, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#2563EB',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SecurityGate;

