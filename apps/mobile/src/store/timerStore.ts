import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TimerState, Task, UserSettings } from '@flowkit/types';
import { DEFAULT_SETTINGS } from '@flowkit/types';

interface TimerStore {
  timerState: TimerState | null;
  tasks: Task[];
  selectedTaskId: string | null;
  accessToken: string | null;
  userId: string | null;
  settings: UserSettings;

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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
