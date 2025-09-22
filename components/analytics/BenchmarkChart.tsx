import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLegend } from 'victory-native';

import { BenchmarkPoint } from '../../types/app';

interface BenchmarkChartProps {
  data: BenchmarkPoint[];
}

const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ data }) => {
  if (!data.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Benchmark data unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio vs BTC & ETH</Text>
      <VictoryChart padding={{ top: 32, bottom: 40, left: 46, right: 16 }} height={260}>
        <VictoryAxis
          tickFormat={() => ''}
          style={{ axis: { stroke: 'rgba(255,255,255,0.12)' } }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${(t / 1000).toFixed(0)}k`}
          style={{
            axis: { stroke: 'rgba(255,255,255,0.12)' },
            tickLabels: { fill: '#9CA3AF', fontSize: 12 },
            grid: { stroke: 'rgba(255,255,255,0.06)' },
          }}
        />
        <VictoryArea
          interpolation="monotoneX"
          data={data.map((p) => ({ x: p.timestamp, y: p.portfolio }))}
          style={{ data: { fill: 'rgba(59,130,246,0.2)', stroke: '#3B82F6', strokeWidth: 2 } }}
        />
        <VictoryArea
          interpolation="monotoneX"
          data={data.map((p) => ({ x: p.timestamp, y: p.btc }))}
          style={{ data: { fill: 'rgba(16,185,129,0.15)', stroke: '#10B981', strokeWidth: 2 } }}
        />
        <VictoryArea
          interpolation="monotoneX"
          data={data.map((p) => ({ x: p.timestamp, y: p.eth }))}
          style={{ data: { fill: 'rgba(244,114,182,0.12)', stroke: '#F472B6', strokeWidth: 2 } }}
        />
        <VictoryLegend
          x={40}
          y={10}
          orientation="horizontal"
          gutter={16}
          style={{ labels: { fill: '#FFFFFF', fontSize: 12 } }}
          data={[
            { name: 'Portfolio', symbol: { fill: '#3B82F6' } },
            { name: 'BTC', symbol: { fill: '#10B981' } },
            { name: 'ETH', symbol: { fill: '#F472B6' } },
          ]}
        />
      </VictoryChart>
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
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
});

export default BenchmarkChart;

