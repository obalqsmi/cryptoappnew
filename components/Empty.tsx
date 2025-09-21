/**
 * Empty Component: A placeholder displayed when a list is empty.
 * It shows a message to the user explaining the empty state and provides an
 * optional action button to guide them on what to do next, e.g., "Explore Market".
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type EmptyProps = {
  message: string;
  actionTitle: string;
  onAction: () => void;
};

const Empty = ({ message, actionTitle, onAction }: EmptyProps) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="database-off-outline" size={48} color="#6B768A" />
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={onAction}>
        <Text style={styles.buttonText}>{actionTitle}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  message: {
    color: '#6B768A',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#2F80ED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});

export default Empty;
