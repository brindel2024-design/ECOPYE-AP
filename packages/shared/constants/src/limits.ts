/** Amounts in centimes DZD unless noted otherwise */

export const PIN_LENGTH = 6;
export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 300;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RATE_LIMIT_PER_PHONE_PER_MINUTE = 3;

export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 min

export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCK_DURATION_SECONDS = 60 * 30; // 30 min

/** Idempotency replay window */
export const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24h

/** Velocity rule thresholds (high-level defaults) */
export const VELOCITY_RULES = {
  MAX_TX_PER_MINUTE: 10,
  MAX_TX_PER_HOUR: 100,
  MAX_AMOUNT_PER_HOUR: 10_000_000n, // 100 000 DZD
};

/** Cagnotte */
export const MAX_CAGNOTTE_TARGET = 100_000_000n; // 1 000 000 DZD
export const MIN_CAGNOTTE_CONTRIBUTION = 10_000n; // 100 DZD

/** Sanctions screening threshold */
export const SANCTIONS_SCREEN_THRESHOLD = 10_000_000n; // 100 000 DZD

/** Audit retention */
export const AUDIT_RETENTION_YEARS = 10;
