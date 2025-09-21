/**
 * Sparkline Component: A minimalist line chart using victory-native.
 * It's designed to be small and simple, perfect for showing price trends
 * in list items like TokenRow. The line color changes based on positive or
 * negative performance.
 */
import React from 'react';
import { View } from 'react-native';
import { VictoryChart, VictoryLine } from 'victory-native';

type SparklineProps = {
  data: number[];
  isPositive: boolean;
};

const Sparkline = ({ data, isPositive }: SparklineProps) => {
  const chartData = data.map((y, x) => ({ x, y }));
  const color = isPositive ? '#1DB954' : '#EF4444';

  return (
    <View pointerEvents="none" style={{height: 40, width: 80}}>
      <VictoryChart
        padding={0}
        width={80}
        height={40}
      >
        <VictoryLine
          data={chartData}
          style={{
            data: { stroke: color, strokeWidth: 2 },
          }}
          interpolation="natural"
        />
      </VictoryChart>
    </View>
  );
};

export default React.memo(Sparkline);
