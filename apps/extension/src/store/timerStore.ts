import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimerState, Task, UserSettings } from '@flowkit/types';
import { DEFAULT_SETTINGS } from '@flowkit/types';

interface TimerStore {
  // Timer state (synced from background)
  timerState: TimerState | null;

  // Tasks (synced from API)
  tasks: Task[];
  selectedTaskId: string | null;

  // Auth
  accessToken: string | null;
  userId: string | null;

  // Settings
  settings: UserSettings;

  // Actions
  setTimerState: (state: TimerState) => void;
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (taskId: string | null) => void;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set) => ({
      timerState: null,
      tasks: [],
      selectedTaskId: null,
      accessToken: null,
      userId: null,
      settings: DEFAULT_SETTINGS,

      setTimerState: (timerState) => set({ timerState }),
      setTasks: (tasks) => set({ tasks }),
      setSelectedTask: (selectedTaskId) => set({ selectedTaskId }),
      setAuth: (accessToken, userId) => set({ accessToken, userId }),
      clearAuth: () => set({ accessToken: null, userId: null }),
      updateSettings: (incoming) =>
        set((s) => ({ settings: { ...s.settings, ...incoming } })),
    }),
    {
      name: 'flowkit-store',
      storage: {
        getItem: async (key) => {
          const result = await chrome.storage.local.get(key as string);
          return result[key as string] ?? null;
        },
        setItem: async (key, value) => {
          await chrome.storage.local.set({ [key as string]: value });
        },
        removeItem: async (key) => {
          await chrome.storage.local.remove(key as string);
        },
      },
    },
  ),
);
