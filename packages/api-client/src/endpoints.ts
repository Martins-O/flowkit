import type {
  User,
  UserSettings,
  Task,
  Project,
  Session,
  Priority,
} from '@flowkit/types';
import type { FlowkitClient } from './client.js';

export function createEndpoints(client: FlowkitClient) {
  return {
    auth: {
      register: (body: { email: string; password: string; name?: string }) =>
        client.post<{ user: User; accessToken: string }>('/auth/register', body),

      login: (body: { email: string; password: string }) =>
        client.post<{ user: User; accessToken: string }>('/auth/login', body),

      logout: () =>
        client.post<void>('/auth/logout', {}),

      me: () =>
        client.get<User>('/auth/me'),

      refresh: () =>
        client.post<{ accessToken: string }>('/auth/refresh', {}),
    },

    tasks: {
      list: (params?: { projectId?: string; completed?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.projectId) qs.set('projectId', params.projectId);
        if (params?.completed !== undefined)
          qs.set('completed', String(params.completed));
        const query = qs.toString() ? `?${qs.toString()}` : '';
        return client.get<Task[]>(`/tasks${query}`);
      },

      create: (body: {
        title: string;
        description?: string;
        projectId?: string;
        estimatedPomodoros?: number;
        priority?: Priority;
      }) => client.post<Task>('/tasks', body),

      update: (id: string, body: Partial<Pick<Task,
        'title' | 'description' | 'estimatedPomodoros' | 'priority' | 'projectId'
      >>) => client.patch<Task>(`/tasks/${id}`, body),

      complete: (id: string) =>
        client.post<Task>(`/tasks/${id}/complete`, {}),

      delete: (id: string) =>
        client.delete<void>(`/tasks/${id}`),
    },

    projects: {
      list: () =>
        client.get<Project[]>('/projects'),

      create: (body: { name: string; color?: string }) =>
        client.post<Project>('/projects', body),

      update: (id: string, body: Partial<Pick<Project, 'name' | 'color'>>) =>
        client.patch<Project>(`/projects/${id}`, body),

      delete: (id: string) =>
        client.delete<void>(`/projects/${id}`),
    },

    sessions: {
      log: (body: {
        taskId?: string;
        type: Session['type'];
        plannedDuration: number;
        actualDuration: number;
        startedAt: string;
        completedAt?: string;
      }) => client.post<Session>('/sessions', body),

      list: (params?: { from?: string; to?: string; taskId?: string }) => {
        const qs = new URLSearchParams();
        if (params?.from) qs.set('from', params.from);
        if (params?.to) qs.set('to', params.to);
        if (params?.taskId) qs.set('taskId', params.taskId);
        const query = qs.toString() ? `?${qs.toString()}` : '';
        return client.get<Session[]>(`/sessions${query}`);
      },
    },

    analytics: {
      daily: () =>
        client.get<{ date: string; count: number }[]>('/analytics/daily'),

      tasks: () =>
        client.get<{ taskId: string; title: string; totalSeconds: number }[]>(
          '/analytics/tasks',
        ),

      streak: () =>
        client.get<{ current: number; longest: number }>('/analytics/streak'),
    },

    settings: {
      get: () =>
        client.get<UserSettings>('/settings'),

      update: (body: Partial<UserSettings>) =>
        client.patch<UserSettings>('/settings', body),
    },
  };
}

export type FlowkitEndpoints = ReturnType<typeof createEndpoints>;
