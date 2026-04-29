import type { ApiResponse } from '@flowkit/types';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onUnauthorized?: () => void;
}

export function createClient(config: ClientConfig) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = config.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const init: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(`${config.baseUrl}${path}`, init);

    if (res.status === 401) {
      config.onUnauthorized?.();
      throw new ApiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const json = (await res.json()) as ApiResponse<T>;

    if (!json.success) {
      throw new ApiError(json.error.code, json.error.message, res.status);
    }

    return json.data;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}

export type FlowkitClient = ReturnType<typeof createClient>;
