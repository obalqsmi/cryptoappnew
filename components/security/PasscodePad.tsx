import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PasscodePadProps {
  digits: string;
  maxLength: number;
  onChange: (next: string) => void;
  onSubmit: () => void;
  error?: string;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '✓'];

export const PasscodePad: React.FC<PasscodePadProps> = ({ digits, maxLength, onChange, onSubmit, error }) => {
  const handleKeyPress = (key: string) => {
    if (key === '←') {
      onChange(digits.slice(0, -1));
      return;
    }
    if (key === '✓') {
      onSubmit();
      return;
    }
    if (digits.length >= maxLength) {
      return;
    }
    onChange(digits + key);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: maxLength }).map((_, index) => {
          const active = index < digits.length;
          return <View key={index} style={[styles.dot, active && styles.dotActive]} />;
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.grid}>
        {keys.map((key) => (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            onPress={() => handleKeyPress(key)}
          >
            <Text style={styles.keyLabel}>{key}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#2F80ED',
    borderColor: '#2F80ED',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  grid: {
    width: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  keyPressed: {
    opacity: 0.7,
  },
  keyLabel: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});

export default PasscodePad;

