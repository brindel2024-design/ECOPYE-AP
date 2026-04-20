import type { ErrorCode } from '@ecopye/constants';

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

export type ApiSuccess<T> = ApiResponse<T> & { success: true; data: T; error: null };
export type ApiFailure = ApiResponse<never> & { success: false; data: null; error: ApiError };
