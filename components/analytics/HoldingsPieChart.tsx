import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VictoryPie } from 'victory-native';

interface HoldingAllocationItem {
  id: string;
  symbol: string;
  value: number;
  percentage: number;
}

interface HoldingsPieChartProps {
  data: HoldingAllocationItem[];
}

const colors = ['#60A5FA', '#FBBF24', '#34D399', '#A855F7', '#F87171', '#38BDF8', '#F97316'];

const HoldingsPieChart: React.FC<HoldingsPieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No holdings yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VictoryPie
        data={data}
        innerRadius={70}
        padAngle={3}
        colorScale={colors}
        x="symbol"
        y="value"
        labels={({ datum }) => `${datum.symbol}\n${datum.percentage.toFixed(1)}%`}
        style={{
          labels: {
            fill: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
          },
        }}
        width={320}
        height={220}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111927',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#9CA3AF',
  },
});

export default HoldingsPieChart;

