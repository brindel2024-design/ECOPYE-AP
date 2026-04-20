import { randomUUID } from 'node:crypto';

interface BuildMetaOptions {
  requestId?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export function buildMeta(opts: BuildMetaOptions = {}) {
  const meta: {
    timestamp: string;
    requestId: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  } = {
    timestamp: new Date().toISOString(),
    requestId: opts.requestId ?? randomUUID(),
  };
  if (opts.pagination) {
    const { total, page, limit } = opts.pagination;
    meta.pagination = {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
  return meta;
}

export function success<T>(data: T, opts?: BuildMetaOptions) {
  return { success: true as const, data, error: null, meta: buildMeta(opts) };
}

export function failure(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  opts?: BuildMetaOptions,
) {
  return {
    success: false as const,
    data: null,
    error: { code, message, details },
    meta: buildMeta(opts),
  };
}
