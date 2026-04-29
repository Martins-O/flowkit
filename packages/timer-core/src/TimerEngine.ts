import type {
  SessionStatus,
  SessionType,
  TimerState,
  UserSettings,
} from '@flowkit/types';
import { DEFAULT_SETTINGS } from '@flowkit/types';

type TickCallback = (state: TimerState) => void;
type SessionEndCallback = (state: TimerState) => void;

export class TimerEngine {
  private settings: UserSettings;
  private state: TimerState;
  private tickCallbacks: Set<TickCallback> = new Set();
  private sessionEndCallbacks: Set<SessionEndCallback> = new Set();

  constructor(settings: Partial<UserSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.state = this.buildInitialState();
  }

  private buildInitialState(): TimerState {
    return {
      status: 'idle',
      type: 'focus',
      elapsed: 0,
      remaining: this.settings.focusDuration,
      sessionCount: 0,
      currentTaskId: null,
    };
  }

  getState(): TimerState {
    return { ...this.state };
  }

  updateSettings(settings: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  start(taskId?: string): void {
    if (this.state.status === 'running') return;
    this.state = {
      ...this.state,
      status: 'running',
      currentTaskId: taskId ?? this.state.currentTaskId,
    };
  }

  pause(): void {
    if (this.state.status !== 'running') return;
    this.state = { ...this.state, status: 'paused' };
  }

  resume(): void {
    if (this.state.status !== 'paused') return;
    this.state = { ...this.state, status: 'running' };
  }

  stop(): void {
    this.state = this.buildInitialState();
  }

  overflow(): void {
    if (this.state.status !== 'completed') return;
    this.state = { ...this.state, status: 'overflow' };
  }

  skipBreak(): void {
    const isBrk =
      this.state.type === 'short_break' || this.state.type === 'long_break';
    if (!isBrk) return;
    this.state = this.buildNextFocusState();
  }

  /**
   * Call this every second from the platform tick adapter.
   * Returns the updated state.
   */
  tick(): TimerState {
    if (this.state.status !== 'running' && this.state.status !== 'overflow') {
      return this.getState();
    }

    const elapsed = this.state.elapsed + 1;
    const duration = this.getDuration(this.state.type);
    const remaining = duration - elapsed;

    if (this.state.status === 'overflow') {
      this.state = { ...this.state, elapsed, remaining };
      this.emit();
      return this.getState();
    }

    if (remaining <= 0) {
      this.handleSessionEnd(elapsed);
    } else {
      this.state = { ...this.state, elapsed, remaining };
      this.emit();
    }

    return this.getState();
  }

  private handleSessionEnd(elapsed: number): void {
    const completedType = this.state.type;
    const sessionCount =
      completedType === 'focus'
        ? this.state.sessionCount + 1
        : this.state.sessionCount;

    const endedState: TimerState = {
      ...this.state,
      status: 'completed',
      elapsed,
      remaining: 0,
      sessionCount,
    };

    this.state = endedState;
    this.emitSessionEnd(endedState);

    if (this.settings.allowOverflow && completedType === 'focus') {
      return;
    }

    const nextType = this.resolveNextType(completedType, sessionCount);
    const autoStart =
      completedType === 'focus'
        ? this.settings.autoStartBreaks
        : this.settings.autoStartFocus;

    this.state = {
      status: autoStart ? 'running' : 'idle',
      type: nextType,
      elapsed: 0,
      remaining: this.getDuration(nextType),
      sessionCount,
      currentTaskId: completedType === 'focus' ? this.state.currentTaskId : null,
    };
  }

  private resolveNextType(
    completed: SessionType,
    sessionCount: number,
  ): SessionType {
    if (completed !== 'focus') return 'focus';
    if (sessionCount % this.settings.sessionsUntilLongBreak === 0) {
      return 'long_break';
    }
    return 'short_break';
  }

  private buildNextFocusState(): TimerState {
    return {
      status: 'idle',
      type: 'focus',
      elapsed: 0,
      remaining: this.settings.focusDuration,
      sessionCount: this.state.sessionCount,
      currentTaskId: this.state.currentTaskId,
    };
  }

  private getDuration(type: SessionType): number {
    switch (type) {
      case 'focus':
        return this.settings.focusDuration;
      case 'short_break':
        return this.settings.shortBreakDuration;
      case 'long_break':
        return this.settings.longBreakDuration;
    }
  }

  onTick(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  onSessionEnd(cb: SessionEndCallback): () => void {
    this.sessionEndCallbacks.add(cb);
    return () => this.sessionEndCallbacks.delete(cb);
  }

  private emit(): void {
    const state = this.getState();
    this.tickCallbacks.forEach((cb) => cb(state));
  }

  private emitSessionEnd(state: TimerState): void {
    this.sessionEndCallbacks.forEach((cb) => cb(state));
  }
}
