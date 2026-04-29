import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { SessionType } from '@flowkit/types';

interface Props {
  remaining: number;
  total: number;
  type: SessionType;
  status: string;
}

const TYPE_COLOR: Record<SessionType, string> = {
  focus: '#7F77DD',
  short_break: '#1D9E75',
  long_break: '#1D9E75',
};

const TYPE_LABEL: Record<SessionType, string> = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
};

const SIZE = 260;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({ remaining, total, type, status }: Props) {
  const progress = Math.max(0, remaining / total);
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const color = TYPE_COLOR[type];
  const isOverflow = remaining < 0;

  const absRemaining = Math.abs(remaining);
  const mins = Math.floor(absRemaining / 60);
  const secs = absRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#1e1d2e"
          strokeWidth={STROKE}
        />
        {/* Progress */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Text style={[styles.timeText, isOverflow && styles.overflowText]}>
          {isOverflow ? '+' : ''}{timeStr}
        </Text>
        <Text style={[styles.typeText, { color }]}>
          {TYPE_LABEL[type].toUpperCase()}
        </Text>
        {status === 'paused' && (
          <Text style={styles.pausedText}>PAUSED</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 52,
    fontWeight: '700',
    color: '#f0eff8',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  overflowText: { color: '#E24B4A' },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  pausedText: {
    fontSize: 11,
    color: '#555',
    letterSpacing: 2,
    marginTop: 2,
  },
});
