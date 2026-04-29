import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionType } from '@flowkit/types';

const COLORS: Record<SessionType, { bg: string; text: string }> = {
  focus: { bg: '#2a2854', text: '#a09ae8' },
  short_break: { bg: '#0d3d2e', text: '#4dc9a3' },
  long_break: { bg: '#0d3d2e', text: '#4dc9a3' },
};

const LABELS: Record<SessionType, string> = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
};

export function SessionTypeTag({ type }: { type: SessionType }) {
  const { bg, text } = COLORS[type];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{LABELS[type]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
