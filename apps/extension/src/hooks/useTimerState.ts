import { useState, useEffect, useCallback } from 'react';
import type { TimerState } from '@flowkit/types';
import { sendMessage } from '../lib/messages.js';

export function useTimerState() {
  const [state, setState] = useState<TimerState | null>(null);

  // Fetch initial state from background
  useEffect(() => {
    sendMessage({ type: 'GET_TIMER_STATE' })
      .then((s) => {
        if (s) setState(s as TimerState);
      })
      .catch(console.error);
  }, []);

  // Listen for background broadcasts
  useEffect(() => {
    function onMessage(msg: unknown) {
      const m = msg as { type?: string; state?: TimerState };
      if (m.type === 'TIMER_STATE_UPDATE' && m.state) {
        setState(m.state);
      }
    }
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  const start = useCallback((taskId?: string) => {
    sendMessage({ type: 'TIMER_START', taskId: taskId ?? '' as string })
      .then((s) => setState(s as TimerState))
      .catch(console.error);
  }, []);

  const pause = useCallback(() => {
    sendMessage({ type: 'TIMER_PAUSE' })
      .then((s) => setState(s as TimerState))
      .catch(console.error);
  }, []);

  const resume = useCallback(() => {
    sendMessage({ type: 'TIMER_RESUME' })
      .then((s) => setState(s as TimerState))
      .catch(console.error);
  }, []);

  const stop = useCallback(() => {
    sendMessage({ type: 'TIMER_STOP' })
      .then((s) => setState(s as TimerState))
      .catch(console.error);
  }, []);

  const overflow = useCallback(() => {
    sendMessage({ type: 'TIMER_OVERFLOW' })
      .then((s) => setState(s as TimerState))
      .catch(console.error);
  }, []);

  const skipBreak = useCallback(() => {
    sendMessage({ type: 'TIMER_SKIP_BREAK' })
      .then((s) => setState(s as TimerState))
      .catch(console.error);
  }, []);

  return { state, start, pause, resume, stop, overflow, skipBreak };
}
