import type { Envelope } from '@ecopye/types';
import { Config } from '@/lib/config';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
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
  const res = await fetch(`${Config.API_URL}/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
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
