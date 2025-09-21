// components/Sparkline.tsx
import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
// Try to import victory-native (may be undefined on some setups)
let VictoryChart: any, VictoryLine: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const v = require('victory-native');
  VictoryChart = v.VictoryChart;
  VictoryLine = v.VictoryLine;
} catch { /* keep undefined to trigger fallback */ }

type SparklineProps = {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
};

const FallbackSvg = ({ data, color, width, height }: { data: number[]; color: string; width: number; height: number; }) => {
  if (!data || data.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((y, i) => {
    const x = i * stepX;
    const ny = height - ((y - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${ny}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={points} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
};

const Sparkline = ({ data, isPositive, width = 80, height = 40 }: SparklineProps) => {
  const color = isPositive ? '#22C55E' : '#EF4444';

  // Fallback if Victory failed to import (undefined) on this platform/build
  if (!VictoryChart || !VictoryLine) {
    return (
      <View pointerEvents="none" style={{ width, height }}>
        <FallbackSvg data={data} color={color} width={width} height={height} />
      </View>
    );
  }

  // Victory path (when available)
  return (
    <View pointerEvents="none" style={{ width, height }}>
      <VictoryChart padding={0} width={width} height={height}>
        <VictoryLine
          data={data.map((y, x) => ({ x, y }))}
          style={{ data: { stroke: color, strokeWidth: 2 } }}
          interpolation="natural"
        />
      </VictoryChart>
    </View>
  );
};

export default memo(Sparkline);
export { Sparkline };
