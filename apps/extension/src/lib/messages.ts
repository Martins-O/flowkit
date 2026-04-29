export type ExtensionMessage =
  | { type: 'TIMER_START'; taskId?: string }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESUME' }
  | { type: 'TIMER_STOP' }
  | { type: 'TIMER_OVERFLOW' }
  | { type: 'TIMER_SKIP_BREAK' }
  | { type: 'GET_TIMER_STATE' }
  | { type: 'SYNC_TASKS' }
  | { type: 'SESSION_LOGGED'; sessionData: LoggedSession }
  | { type: 'flowkit-activity'; event: { type: string; [key: string]: unknown }; url: string };

export interface LoggedSession {
  taskId?: string;
  type: 'focus' | 'short_break' | 'long_break';
  plannedDuration: number;
  actualDuration: number;
  startedAt: string;
  completedAt: string;
}

export function sendMessage(message: ExtensionMessage): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Flowkit] Message error:', chrome.runtime.lastError);
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}
