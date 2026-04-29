import { createClient, createEndpoints } from '@flowkit/api-client';
import { useTimerStore } from '../store/timerStore.js';

const BASE_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';

export function getApiClient() {
  const token = useTimerStore.getState().accessToken;
  const client = createClient({
    baseUrl: BASE_URL,
    getAccessToken: () => token,
    onUnauthorized: () => {
      useTimerStore.getState().clearAuth();
    },
  });
  return createEndpoints(client);
}
