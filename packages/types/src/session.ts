export type SessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'overflow'
  | 'abandoned';

export type SessionType = 'focus' | 'short_break' | 'long_break';

export interface Session {
  id: string;
  userId: string;
  taskId: string | null;
  type: SessionType;
  status: SessionStatus;
  plannedDuration: number;
  actualDuration: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface TimerState {
  status: SessionStatus;
  type: SessionType;
  elapsed: number;
  remaining: number;
  sessionCount: number;
  currentTaskId: string | null;
}
