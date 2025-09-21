/**
 * Segmented Component: A customizable, pill-style segmented control.
 * It's used for creating filter bars or tab-like interfaces, such as
 * the category filters on the Dashboard and Market screens.
 */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SegmentedProps = {
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
};

const Segmented = ({ options, selected, onSelect }: SegmentedProps) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, selected === option && styles.chipActive]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option)
            }}
          >
            <Text style={[styles.chipText, selected === option && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111927',
    borderRadius: 12,
    padding: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: '#0F1626',
  },
  chipText: {
    color: '#6B768A',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

export default Segmented;
