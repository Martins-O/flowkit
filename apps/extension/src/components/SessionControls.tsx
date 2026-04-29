import React from 'react';
import type { SessionStatus, SessionType } from '@flowkit/types';

interface Props {
  status: SessionStatus;
  type: SessionType;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOverflow: () => void;
  onSkipBreak: () => void;
  onSelectTask: () => void;
  selectedTaskTitle?: string;
}

export function SessionControls({
  status,
  type,
  onStart,
  onPause,
  onResume,
  onStop,
  onOverflow,
  onSkipBreak,
  onSelectTask,
  selectedTaskTitle,
}: Props) {
  const isBreak = type === 'short_break' || type === 'long_break';

  return (
    <div className="flex flex-col items-center gap-4 w-full px-6">
      {/* Task selector button (only during focus) */}
      {!isBreak && (
        <button
          onClick={onSelectTask}
          className="w-full text-sm text-left px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors truncate"
        >
          {selectedTaskTitle ? (
            <span className="text-gray-200">{selectedTaskTitle}</span>
          ) : (
            <span className="text-gray-500">Select a task...</span>
          )}
        </button>
      )}

      {/* Primary controls */}
      <div className="flex items-center gap-3">
        {status === 'idle' && (
          <PrimaryButton onClick={onStart} color="#7F77DD">
            Start
          </PrimaryButton>
        )}

        {status === 'running' && (
          <>
            <PrimaryButton onClick={onPause} color="#534AB7">
              Pause
            </PrimaryButton>
            <SecondaryButton onClick={onStop}>Stop</SecondaryButton>
          </>
        )}

        {status === 'paused' && (
          <>
            <PrimaryButton onClick={onResume} color="#7F77DD">
              Resume
            </PrimaryButton>
            <SecondaryButton onClick={onStop}>Stop</SecondaryButton>
          </>
        )}

        {status === 'completed' && type === 'focus' && (
          <PrimaryButton onClick={onOverflow} color="#534AB7">
            Keep going
          </PrimaryButton>
        )}

        {status === 'completed' && isBreak && (
          <PrimaryButton onClick={onSkipBreak} color="#1D9E75">
            Start focus
          </PrimaryButton>
        )}

        {status === 'overflow' && (
          <>
            <PrimaryButton onClick={onStop} color="#E24B4A">
              End session
            </PrimaryButton>
          </>
        )}
      </div>

      {/* Skip break */}
      {(status === 'running' || status === 'paused') && isBreak && (
        <button
          onClick={onSkipBreak}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip break
        </button>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-3 rounded-2xl font-semibold text-sm text-white transition-opacity hover:opacity-90 active:opacity-75"
      style={{ backgroundColor: color }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3 rounded-2xl text-sm text-gray-400 border border-white/10 hover:border-white/20 hover:text-gray-200 transition-colors"
    >
      {children}
    </button>
  );
}
