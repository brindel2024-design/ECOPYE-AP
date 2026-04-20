import { ERROR_CODES, type ErrorCode } from '@ecopye/constants';

export class AppError extends Error {
  readonly code: ErrorCode | string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode | string,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 422, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(ERROR_CODES.NOT_FOUND, `${resource} introuvable`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise') {
    super(ERROR_CODES.AUTH_UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Action interdite') {
    super(ERROR_CODES.AUTH_FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Trop de requêtes') {
    super(ERROR_CODES.RATE_LIMITED, message, 429);
    this.name = 'RateLimitedError';
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super(ERROR_CODES.INSUFFICIENT_FUNDS, 'Solde insuffisant', 422);
    this.name = 'InsufficientFundsError';
  }
}
