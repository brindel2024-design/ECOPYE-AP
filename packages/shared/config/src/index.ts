import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().int().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().default(20),
  DATABASE_SSL: z.coerce.boolean().default(false),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_TLS: z.coerce.boolean().default(false),

  JWT_PRIVATE_KEY_PATH: z.string(),
  JWT_PUBLIC_KEY_PATH: z.string(),
  JWT_ISSUER: z.string().default('ecopye.fr'),
  JWT_AUDIENCE: z.string().default('ecopye-app'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  AES_ENCRYPTION_KEY: z.string().length(64, 'AES_ENCRYPTION_KEY must be 32 bytes hex'),

  ARGON2_MEMORY_COST: z.coerce.number().int().default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().default(4),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  ONFIDO_API_TOKEN: z.string().optional(),
  ONFIDO_WEBHOOK_TOKEN: z.string().optional(),

  FCM_PROJECT_ID: z.string().optional(),
  FCM_SERVICE_ACCOUNT_PATH: z.string().optional(),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  RATE_LIMIT_GLOBAL: z.coerce.number().int().default(1000),
  RATE_LIMIT_AUTH: z.coerce.number().int().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60000),

  FEATURE_BEA_ENABLED: z.coerce.boolean().default(false),
  FEATURE_AGENT_NETWORK_ENABLED: z.coerce.boolean().default(false),
  FEATURE_MERCHANT_ENABLED: z.coerce.boolean().default(true),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const config = new Proxy({} as AppConfig, {
  get(_t, prop) {
    return loadConfig()[prop as keyof AppConfig];
  },
});
