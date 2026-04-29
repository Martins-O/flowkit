import React from 'react';

interface Props {
  sessionCount: number;
  onLogout: () => void;
}

export function Header({ sessionCount, onLogout }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <span className="text-sm font-bold tracking-wide text-white">Flowkit</span>
      <div className="flex items-center gap-3">
        {sessionCount > 0 && (
          <span className="text-xs text-gray-500">
            {sessionCount} today
          </span>
        )}
        <button
          onClick={onLogout}
          className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
