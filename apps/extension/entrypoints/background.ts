import { defineBackground } from 'wxt/sandbox';
import { TimerEngine } from '@flowkit/timer-core';
import { DEFAULT_SETTINGS } from '@flowkit/types';
import type { TimerState, UserSettings } from '@flowkit/types';
import type { ExtensionMessage, LoggedSession } from '../src/lib/messages.js';
import { createAsyncClient } from '../src/lib/apiClient.js';

export default defineBackground(() => {
  const ALARM_NAME = 'flowkit-tick';
  const STATE_KEY = 'flowkit-timer-state';
  const SETTINGS_KEY = 'flowkit-settings';

  let engine: TimerEngine | null = null;
  let sessionStartedAt: Date | null = null;

  // ─── Bootstrap ───────────────────────────────────────────

  async function getSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return {
      ...DEFAULT_SETTINGS,
      ...(result[SETTINGS_KEY] as Partial<UserSettings> ?? {}),
    };
  }

  async function getEngine(): Promise<TimerEngine> {
    if (!engine) {
      const settings = await getSettings();
      engine = new TimerEngine(settings);

      // Restore persisted state if available
      const stored = await chrome.storage.local.get(STATE_KEY);
      const saved = stored[STATE_KEY] as TimerState | undefined;
      if (saved && (saved.status === 'running' || saved.status === 'paused')) {
        // Re-hydrate — timer was running before service worker restart
        engine.start(saved.currentTaskId ?? undefined);
        if (saved.status === 'paused') engine.pause();
      }
    }
    return engine;
  }

  // ─── Tick adapter ─────────────────────────────────────────────

  chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name !== ALARM_NAME) return;
    const e = await getEngine();
    const prevState = e.getState();
    const nextState = e.tick();

    await persistState(nextState);
    await broadcastState(nextState);

    // Session just ended
    if (
      prevState.status === 'running' &&
      nextState.status !== 'running' &&
      prevState.type === 'focus'
    ) {
      await logSession(prevState, nextState);
    }

    // Stop alarm if timer is idle or completed and not overflow
    if (nextState.status === 'idle' || nextState.status === 'completed') {
      chrome.alarms.clear(ALARM_NAME);
    }
  });

  // ─── State persistence + broadcast ─────────────────────────────

  async function persistState(state: TimerState): Promise<void> {
    await chrome.storage.local.set({ [STATE_KEY]: state });
  }

  async function broadcastState(state: TimerState): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ type: 'TIMER_STATE_UPDATE', state });
    } catch {
      // Popup not open — ignore
    }
  }

  // ─── Session logging ─────────────────────────────────────────────

  async function logSession(
    prevState: TimerState,
    _nextState: TimerState,
  ): Promise<void> {
    if (!sessionStartedAt) return;

    const completedAt = new Date();
      const session: LoggedSession = {
        taskId: prevState.currentTaskId ?? '' as string,
        type: 'focus',
        plannedDuration: prevState.remaining + prevState.elapsed,
        actualDuration: prevState.elapsed,
        startedAt: sessionStartedAt.toISOString(),
        completedAt: completedAt.toISOString(),
      };

    sessionStartedAt = null;

    try {
      const api = await createAsyncClient();
      await api.sessions.log(session);
    } catch (err) {
      console.error('[Flowkit] Failed to log session:', err);
      // Queue for retry (store in chrome.storage for offline support)
      const q = await chrome.storage.local.get('flowkit-session-queue');
      const queue: LoggedSession[] = (q['flowkit-session-queue'] as LoggedSession[]) ?? [];
      queue.push(session);
      await chrome.storage.local.set({ 'flowkit-session-queue': queue });
    }
  }

  // Retry queued sessions when back online
  async function drainSessionQueue(): Promise<void> {
    const q = await chrome.storage.local.get('flowkit-session-queue');
    const queue: LoggedSession[] = (q['flowkit-session-queue'] as LoggedSession[]) ?? [];
    if (queue.length === 0) return;

    try {
      const api = await createAsyncClient();
      for (const session of queue) {
        await api.sessions.log(session);
      }
      await chrome.storage.local.set({ 'flowkit-session-queue': [] });
    } catch {
      // Still offline — leave queue intact
    }
  }

  // ─── Notification ──────────────────────────────────────────────

  function notify(title: string, message: string): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/48.png',
      title,
      message,
    });
  }

  // ─── Message handler ─────────────────────────────────────────────

  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
      (async () => {
        const e = await getEngine();

        switch (message.type) {
          case 'TIMER_START': {
            e.start(message.taskId);
            sessionStartedAt = new Date();
            chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 });
            const state = e.getState();
            await persistState(state);
            sendResponse(state);
            break;
          }

          case 'TIMER_PAUSE': {
            e.pause();
            chrome.alarms.clear(ALARM_NAME);
            const state = e.getState();
            await persistState(state);
            sendResponse(state);
            break;
          }

          case 'TIMER_RESUME': {
            e.resume();
            chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 });
            const state = e.getState();
            await persistState(state);
            sendResponse(state);
            break;
          }

          case 'TIMER_STOP': {
            e.stop();
            chrome.alarms.clear(ALARM_NAME);
            sessionStartedAt = null;
            const state = e.getState();
            await persistState(state);
            sendResponse(state);
            break;
          }

          case 'TIMER_OVERFLOW': {
            e.overflow();
            const state = e.getState();
            await persistState(state);
            sendResponse(state);
            break;
          }

          case 'TIMER_SKIP_BREAK': {
            e.skipBreak();
            const state = e.getState();
            await persistState(state);
            sendResponse(state);
            break;
          }

          case 'GET_TIMER_STATE': {
            const stored = await chrome.storage.local.get(STATE_KEY);
            sendResponse(stored[STATE_KEY] ?? e.getState());
            break;
          }

          case 'SYNC_TASKS': {
            await drainSessionQueue();
            sendResponse({ ok: true });
            break;
          }

          default:
            sendResponse(null);
        }
      })();

      return true; // Keep message channel open for async response
    },
  );

  // ─── Notifications on session end ───────────────────────────────

  chrome.storage.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>) => {
    const newState = changes[STATE_KEY]?.newValue as TimerState | undefined;
    if (!newState) return;

    if (newState.status === 'completed') {
      if (newState.type === 'focus') {
        notify('Focus session complete!', 'Time for a break. Well done.');
      } else {
        notify('Break over!', 'Ready to focus again?');
      }
    }
  });

  // ─── Online event — drain queue ────────────────────────────────

  self.addEventListener('online', () => {
    drainSessionQueue().catch(console.error);
  });
});
