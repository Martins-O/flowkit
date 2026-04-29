import { useState, useEffect } from 'react';
import { createClient, createEndpoints } from '@flowkit/api-client';

const env = (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env) || {};
const BASE_URL = env.VITE_API_URL || 'http://localhost:3002/api/v1';

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local
      .get('flowkit-store')
      .then((result) => {
        const store = result['flowkit-store'] as
          | { state?: { accessToken?: string } }
          | undefined;
        setAccessToken(store?.state?.accessToken ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const client = createClient({
      baseUrl: BASE_URL,
      getAccessToken: () => null,
    });
    const api = createEndpoints(client);
    const { accessToken: token, user } = await api.auth.login({ email, password });

    await chrome.storage.local.set({
      'flowkit-store': {
        state: { accessToken: token, userId: user.id },
        version: 0,
      },
    });
    setAccessToken(token);
  }

  async function logout(): Promise<void> {
    await chrome.storage.local.remove('flowkit-store');
    setAccessToken(null);
  }

  return { accessToken, loading, login, logout };
}
