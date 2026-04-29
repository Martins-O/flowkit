import { defineContentScript } from 'wxt/sandbox';
import type { TimerState } from '@flowkit/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    const IDLE_THRESHOLD_MS = 30_000; // 30 seconds of no activity = idle
    const REPORT_INTERVAL_MS = 5_000; // report to background every 5s
    const ACTIVITY_KEY = 'flowkit-activity';

    let lastActivityAt = Date.now();
    let isIdle = false;
    let timerRunning = false;
    let reportInterval: ReturnType<typeof setInterval> | null = null;

    // ─── Activity detection ──────────────────────────────────────//

    function onActivity() {
      const wasIdle = isIdle;
      lastActivityAt = Date.now();
      isIdle = false;

      if (wasIdle && timerRunning) {
        reportActivity({ type: 'RETURNED_FROM_IDLE' });
      }
    }

    function checkIdle() {
      const now = Date.now();
      const elapsed = now - lastActivityAt;

      if (!isIdle && elapsed >= IDLE_THRESHOLD_MS && timerRunning) {
        isIdle = true;
        reportActivity({ type: 'WENT_IDLE', idleMs: elapsed });
      }
    }

    // ─── Visibility detection ──────────────────────────────────────//

    function onVisibilityChange() {
      if (!timerRunning) return;

      if (document.hidden) {
        reportActivity({ type: 'TAB_HIDDEN' });
      } else {
        reportActivity({ type: 'TAB_VISIBLE' });
        onActivity();
      }
    }

    // ─── Report to background ──────────────────────────────────────//

    type ActivityEvent =
      | { type: 'WENT_IDLE'; idleMs: number }
      | { type: 'RETURNED_FROM_IDLE' }
      | { type: 'TAB_HIDDEN' }
      | { type: 'TAB_VISIBLE' }
      | { type: 'HEARTBEAT'; isIdle: boolean; lastActivityAt: number };

    function reportActivity(event: ActivityEvent) {
      chrome.runtime
        .sendMessage({ type: ACTIVITY_KEY, event, url: location.href })
        .catch(() => {
          // Background not ready — ignore
        });
    }

    // ─── Heartbeat ──────────────────────────────────────────────//

    function startReporting() {
      if (reportInterval) return;
      reportInterval = setInterval(() => {
        checkIdle();
        if (timerRunning) {
          reportActivity({
            type: 'HEARTBEAT',
            isIdle,
            lastActivityAt,
          });
        }
      }, REPORT_INTERVAL_MS);
    }

    function stopReporting() {
      if (reportInterval) {
        clearInterval(reportInterval);
        reportInterval = null;
      }
    }

    // ─── Sync timer state from background ──────────────────────────────//

    function syncTimerState(state: TimerState) {
      const wasRunning = timerRunning;
      timerRunning = state.status === 'running' || state.status === 'overflow';

      if (timerRunning && !wasRunning) {
        startReporting();
      } else if (!timerRunning && wasRunning) {
        stopReporting();
        isIdle = false;
      }
    }

    // Poll timer state on load
    chrome.runtime
      .sendMessage({ type: 'GET_TIMER_STATE' })
      .then((state) => {
        if (state) syncTimerState(state as TimerState);
      })
      .catch(() => {});

    // Listen for background broadcasts
    chrome.runtime.onMessage.addListener((message: unknown) => {
      const msg = message as { type?: string; state?: TimerState };
      if (msg.type === 'TIMER_STATE_UPDATE' && msg.state) {
        syncTimerState(msg.state);
      }
    });

    // ─── Event listeners ──────────────────────────────────────────────//

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ] as const;

    for (const event of activityEvents) {
      document.addEventListener(event, onActivity, { passive: true });
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    // ─── Cleanup ─────────────────────────────────────────────────//

    window.addEventListener('beforeunload', () => {
      stopReporting();
      for (const event of activityEvents) {
        document.removeEventListener(event, onActivity);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  },
});
