import { useState, useEffect } from 'react';
import type { Task } from '@flowkit/types';
import { createAsyncClient } from '../lib/apiClient.js';

export function useTasks(accessToken: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    setLoading(true);
    createAsyncClient()
      .then((api) => api.tasks.list({ completed: false }))
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  return { tasks, loading, setTasks };
}
