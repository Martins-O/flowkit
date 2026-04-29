import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatCard({ label, value, subtitle, color = '#7F77DD' }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a38',
    alignItems: 'center',
    gap: 4,
  },
  value: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 12, color: '#888', textAlign: 'center' },
  subtitle: { fontSize: 11, color: '#555', textAlign: 'center' },
});
