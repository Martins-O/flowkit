import React from 'react';
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

export function TimerRing({ remaining, total, type, status }: Props) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, remaining / total);
  const dashOffset = circumference * (1 - progress);
  const color = TYPE_COLOR[type];

  const mins = Math.floor(Math.abs(remaining) / 60);
  const secs = Math.abs(remaining) % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isOverflow = remaining < 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-52 h-52">
        <svg width="208" height="208" viewBox="0 0 208 208">
          {/* Track */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="none"
            stroke="#1e1d2e"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 104 104)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color: isOverflow ? '#E24B4A' : '#f0eff8' }}
          >
            {isOverflow ? '+' : ''}{timeStr}
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color }}>
            {TYPE_LABEL[type]}
          </span>
          {status === 'paused' && (
            <span className="text-xs text-gray-500 mt-1">paused</span>
          )}
        </div>
      </div>
    </div>
  );
}
