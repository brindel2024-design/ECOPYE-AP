import type { Envelope } from '@ecopye/types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOpts = Omit<RequestInit, 'body'> & {
  body?: unknown;
  idempotencyKey?: string;
  token?: string;
};

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { body, idempotencyKey, token, headers, ...rest } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  });

  const json = (await res.json()) as Envelope<T>;
  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN',
      json.error?.message ?? 'Erreur inconnue',
      res.status,
      json.error?.details,
    );
  }
  return json.data as T;
}
