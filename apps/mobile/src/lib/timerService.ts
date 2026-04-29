import { TimerEngine } from '@flowkit/timer-core';
import type { TimerState, UserSettings } from '@flowkit/types';
import { DEFAULT_SETTINGS } from '@flowkit/types';
import {
  scheduleSessionEndNotification,
  cancelAllNotifications,
} from './notifications.js';
import { getApiClient } from './apiClient.js';
import { useTimerStore } from '../store/timerStore.js';

const TICK_INTERVAL_MS = 1000;

class TimerService {
  private engine: TimerEngine;
  private interval: ReturnType<typeof setInterval> | null = null;
  private notificationId: string | null = null;
  private sessionStartedAt: Date | null = null;
  private listeners: Set<(state: TimerState) => void> = new Set();

  constructor() {
    const settings = useTimerStore.getState().settings;
    this.engine = new TimerEngine(settings);
  }

  getState(): TimerState {
    return this.engine.getState();
  }

  subscribe(cb: (state: TimerState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(state: TimerState): void {
    useTimerStore.getState().setTimerState(state);
    this.listeners.forEach((cb) => cb(state));
  }

  private startTick(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      const prevState = this.engine.getState();
      const nextState = this.engine.tick();
      this.emit(nextState);

      // Session completed
      if (
        prevState.status === 'running' &&
        nextState.status !== 'running' &&
        prevState.type === 'focus'
      ) {
        this.logSession(prevState).catch(console.error);
      }

      // Stop ticking when idle
      if (nextState.status === 'idle') {
        this.stopTick();
      }
    }, TICK_INTERVAL_MS);
  }

  private stopTick(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async start(taskId?: string, settings?: UserSettings): Promise<void> {
    if (settings) {
      this.engine.updateSettings(settings);
    }

    this.engine.start(taskId);
    this.sessionStartedAt = new Date();

    const state = this.engine.getState();
    this.emit(state);
    this.startTick();

    // Schedule end notification
    await cancelAllNotifications();
    this.notificationId = await scheduleSessionEndNotification(
      state.remaining,
      state.type,
    );
  }

  async pause(): Promise<void> {
    this.engine.pause();
    this.stopTick();
    await cancelAllNotifications();
    this.emit(this.engine.getState());
  }

  async resume(): Promise<void> {
    this.engine.resume();
    const state = this.engine.getState();
    this.emit(state);
    this.startTick();

    await cancelAllNotifications();
    this.notificationId = await scheduleSessionEndNotification(
      state.remaining,
      state.type,
    );
  }

  async stop(): Promise<void> {
    this.engine.stop();
    this.stopTick();
    this.sessionStartedAt = null;
    await cancelAllNotifications();
    this.emit(this.engine.getState());
  }

  overflow(): void {
    this.engine.overflow();
    this.emit(this.engine.getState());
  }

  skipBreak(): void {
    this.engine.skipBreak();
    this.stopTick();
    this.emit(this.engine.getState());
  }

  private async logSession(completedState: TimerState): Promise<void> {
    if (!this.sessionStartedAt) return;

    const completedAt = new Date();
    const session = {
      taskId: completedState.currentTaskId ?? undefined,
      type: 'focus' as const,
      plannedDuration: completedState.elapsed + completedState.remaining,
      actualDuration: completedState.elapsed,
      startedAt: this.sessionStartedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    } as Parameters<ReturnType<typeof getApiClient>['sessions']['log']>[0];

    this.sessionStartedAt = null;

    try {
      const api = getApiClient();
      await api.sessions.log(session);
    } catch (err) {
      console.error('[Flowkit] Failed to log session:', err);
      // TODO: queue for retry (V2 - offline queue)
    }
  }
}

// Singleton
export const timerService = new TimerService();
