import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color = '#7F77DD', height = 120 }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.chart, { height }]}>
        {data.map((bar, i) => {
          const barHeight = Math.max((bar.value / max) * (height - 16), bar.value > 0 ? 4 : 0);
          return (
            <View key={i} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                {bar.value > 0 && (
                  <Text style={styles.barValue}>{bar.value}</Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: bar.value > 0 ? color : '#1e1d2e',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{bar.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barContainer: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barValue: { fontSize: 9, color: '#888', marginBottom: 2 },
  barLabel: { fontSize: 9, color: '#555', textAlign: 'center' },
});
