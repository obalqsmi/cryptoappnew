/**
 * Price Chart Component: A detailed, interactive chart for a specific token.
 * It uses the 'victory-native' library to render the chart and allows users
 * to select different time ranges (24H, 7D, 1M, 1Y) to view historical price data.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Appearance, StyleSheet, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { formatCurrency } from '../services/formatting';
import { fetchTokenHistory } from '../services/prices';
import { useAppStore } from '../state/appStore';
import Segmented from './Segmented';

type TimeRange = '24H' | '7D' | '1M' | '1Y';
const RANGES: TimeRange[] = ['24H', '7D', '1M', '1Y'];

const daysForRange: Record<TimeRange, number> = {
  '24H': 1,
  '7D': 7,
  '1M': 30,
  '1Y': 365,
};

export default function PriceChart({ tokenId }: { tokenId: string }) {
  const { currency, theme } = useAppStore();
  const [data, setData] = useState<{ x: Date; y: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>('7D');

  const colorScheme = theme === 'system' ? Appearance.getColorScheme() : theme;
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  useEffect(() => {
    let isActive = true;
    async function loadHistory() {
      setLoading(true);
      const historyData = await fetchTokenHistory(tokenId, currency, daysForRange[range]);
      if (isActive && historyData.prices) {
        setData(historyData.prices.map(([timestamp, price]) => ({ x: new Date(timestamp), y: price })));
      }
      setLoading(false);
    }
    loadHistory();
    return () => { isActive = false; };
  }, [tokenId, currency, range]);
  
  const chartColor = data.length > 1 && data[data.length - 1].y >= data[0].y ? '#1DB954' : '#EF4444';

  if (loading) {
    return <ActivityIndicator size="large" color={isDarkMode ? "#FFF" : "#000"} style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
        <View style={{paddingHorizontal: 16, marginBottom: 8}}>
            <Segmented options={RANGES} selected={range} onSelect={setRange} />
        </View>
        <VictoryChart
            height={250}
            padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
            containerComponent={<VictoryVoronoiContainer voronoiDimension="x" labels={({ datum }) => `${formatCurrency(datum.y, currency)}\n${datum.x.toLocaleDateString()}`} labelComponent={<VictoryTooltip cornerRadius={5} flyoutStyle={{ fill: "#000" }} style={{ fill: "#FFF" }} />} />}
        >
            <VictoryAxis dependentAxis style={{ axis: { stroke: 'transparent' }, tickLabels: { fill: isDarkMode ? '#6B768A' : '#687385' } }} />
            <VictoryAxis style={{ axis: { stroke: 'transparent' }, tickLabels: { fill: 'transparent' } }} />
            <VictoryLine
                data={data}
                style={{ data: { stroke: chartColor, strokeWidth: 2 } }}
                interpolation="monotoneX"
            />
        </VictoryChart>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    minHeight: 280,
  },
  loader: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

