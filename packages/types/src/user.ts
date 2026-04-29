export type SoundTheme = 'bell' | 'digital' | 'soft';

export interface UserSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  allowOverflow: boolean;
  soundEnabled: boolean;
  soundTheme: SoundTheme;
}

export const DEFAULT_SETTINGS: UserSettings = {
  focusDuration: 1500,
  shortBreakDuration: 300,
  longBreakDuration: 900,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  allowOverflow: false,
  soundEnabled: true,
  soundTheme: 'bell',
};

export interface User {
  id: string;
  email: string;
  name: string | null;
  settings: UserSettings;
  createdAt: Date;
}
