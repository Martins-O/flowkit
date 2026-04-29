import React, { useState } from 'react';
import { useAuth } from '../../src/hooks/useAuth.js';
import { useTimerState } from '../../src/hooks/useTimerState.js';
import { useTasks } from '../../src/hooks/useTasks.js';
import { TimerRing } from '../../src/components/TimerRing.js';
import { SessionControls } from '../../src/components/SessionControls.js';
import { TaskSelector } from '../../src/components/TaskSelector.js';
import { AuthForm } from '../../src/components/AuthForm.js';
import { Header } from '../../src/components/Header.js';
import { createAsyncClient } from '../../src/lib/apiClient.js';
import { DEFAULT_SETTINGS } from '@flowkit/types';

export default function App() {
  const { accessToken, loading: authLoading, login, logout } = useAuth();
  const { state, start, pause, resume, stop, overflow, skipBreak } = useTimerState();
  const { tasks, setTasks } = useTasks(accessToken);
  const [view, setView] = useState<'timer' | 'tasks'>('timer');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  async function handleCreateTask(title: string) {
    const api = await createAsyncClient();
    const task = await api.tasks.create({ title, estimatedPomodoros: 1 });
    setTasks((prev) => [task, ...prev]);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    return <AuthForm onLogin={login} />;
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const timerState = state ?? {
    status: 'idle' as const,
    type: 'focus' as const,
    elapsed: 0,
    remaining: DEFAULT_SETTINGS.focusDuration,
    sessionCount: 0,
    currentTaskId: null,
  };

  const total =
    timerState.type === 'focus'
      ? DEFAULT_SETTINGS.focusDuration
      : timerState.type === 'short_break'
      ? DEFAULT_SETTINGS.shortBreakDuration
      : DEFAULT_SETTINGS.longBreakDuration;

  if (view === 'tasks') {
    return (
      <div className="h-full flex flex-col" style={{ height: 480 }}>
        <TaskSelector
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelect={(id) => {
            setSelectedTaskId(id);
            setView('timer');
          }}
          onClose={() => setView('timer')}
          onCreateTask={handleCreateTask}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 480 }}>
      <Header
        sessionCount={timerState.sessionCount}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6">
        <TimerRing
          remaining={timerState.remaining}
          total={total}
          type={timerState.type}
          status={timerState.status}
        />

        <SessionControls
          status={timerState.status}
          type={timerState.type}
          selectedTaskTitle={selectedTask?.title ?? '' as string}
          onStart={() => start(selectedTaskId ?? undefined)}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onOverflow={overflow}
          onSkipBreak={skipBreak}
          onSelectTask={() => setView('tasks')}
        />
      </div>
    </div>
  );
}
