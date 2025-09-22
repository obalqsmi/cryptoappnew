import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { selectHoldingsAllocation, selectPnl, selectPortfolioValue, useAppStore } from '../../state/store';

interface AiAssistantPanelProps {
  onOpenBrowser: (url: string) => void;
}

const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({ onOpenBrowser }) => {
  const insights = useAppStore((state) => {
    const wallet = selectHoldingsAllocation(state);
    const pnl7d = selectPnl(state, '7d');
    const pnlAll = selectPnl(state, 'all');
    const total = selectPortfolioValue(state);
    const alerts = state.priceAlerts.length;
    return { wallet, pnl7d, pnlAll, total, alerts };
  });

  const suggestions = useMemo(() => {
    const ideas: string[] = [];
    if (insights.pnl7d.value < 0) {
      ideas.push('Consider rebalancing into assets with stronger weekly momentum.');
    } else {
      ideas.push('Weekly gains look healthy. You could set trailing alerts to lock in profit.');
    }
    if (insights.wallet.length > 4) {
      const top = insights.wallet.sort((a, b) => b.percentage - a.percentage)[0];
      ideas.push(`Your largest position is ${top.symbol} at ${top.percentage.toFixed(1)}%. Evaluate diversification.`);
    }
    if (insights.alerts === 0) {
      ideas.push('Set price or portfolio alerts to stay ahead of volatility.');
    }
    if (insights.total < 50000) {
      ideas.push('Enable simulation mode to practice deploying the remaining dry powder.');
    }
    return ideas;
  }, [insights]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Pressable onPress={() => onOpenBrowser('https://www.coingecko.com')}>
          <Text style={styles.link}>Open News</Text>
        </Pressable>
      </View>
      {suggestions.map((suggestion, index) => (
        <View key={index} style={styles.suggestion}>
          <View style={styles.dot} />
          <Text style={styles.text}>{suggestion}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#111927',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#60A5FA',
  },
  suggestion: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginTop: 6,
  },
  text: {
    color: '#D1D5DB',
    flex: 1,
    lineHeight: 18,
  },
});

export default AiAssistantPanel;

