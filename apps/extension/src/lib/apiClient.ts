import { createClient, createEndpoints } from '@flowkit/api-client';

const env = (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env) || {};
const BASE_URL = env.VITE_API_URL || 'http://localhost:3000/api/v1';

async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get('flowkit-store');
  const store = result['flowkit-store'] as { state?: { accessToken?: string } } | undefined;
  return (store?.state?.accessToken as string) || null;
}

const client = createClient({
  baseUrl: BASE_URL,
  getAccessToken: () => null, // sync fallback — background uses async version
});

export const api = createEndpoints(client);

// Async version for background worker
export async function createAsyncClient() {
  const token = await getToken();
  const c = createClient({
    baseUrl: BASE_URL,
    getAccessToken: () => token,
  });
  return createEndpoints(c);
}
