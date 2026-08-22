import { z } from 'zod';

const optionalPositiveNumber = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const optionalBoolean = z.preprocess((value) => {
  if (value === '' || value === undefined) {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value;
}, z.boolean().optional());

const durationPattern = /^\d+(ms|s|m|h|d|w)$/i;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1).optional(),
  DB_HOST: z.string().min(1).optional(),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1).optional(),
  DB_USER: z.string().min(1).optional(),
  DB_PASSWORD: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(durationPattern).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(durationPattern).default('7d'),
  CORS_ORIGINS: z.string().min(1),
  TZ: z.string().default('Europe/Madrid'),
  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'verbose', 'debug']).default('log'),
  SWAGGER_ENABLED: optionalBoolean,
  TRUST_PROXY: optionalBoolean,
  BOOTSTRAP_SUPER_ADMIN: optionalBoolean,
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(12)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
      message: 'SUPER_ADMIN_PASSWORD must contain letters and numbers'
    })
    .optional(),
  SUPER_ADMIN_NAME: z.string().min(1).max(120).optional(),
  SMTP_HOST: z.string().optional().or(z.literal('')),
  SMTP_PORT: optionalPositiveNumber,
  SMTP_USER: z.string().optional().or(z.literal('')),
  SMTP_PASSWORD: z.string().optional().or(z.literal('')),
  SMTP_FROM: z.string().optional().or(z.literal(''))
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  corsOrigins: string[];
  tz: string;
  logLevel: 'error' | 'warn' | 'log' | 'verbose' | 'debug';
  swaggerEnabled: boolean;
  trustProxy: boolean;
  bootstrap: {
    superAdmin: {
      enabled: boolean;
      email?: string;
      password?: string;
      name?: string;
    };
  };
  database: {
    url?: string;
    host?: string;
    port?: number;
    name?: string;
    user?: string;
    password?: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    from?: string;
  };
};

export function createAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsed = envSchema.parse(env);
  const corsOrigins = parsed.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);

  if (!corsOrigins.length) {
    throw new Error('CORS_ORIGINS must contain at least one allowed origin');
  }

  if (parsed.NODE_ENV === 'production') {
    const unsafeOrigin = corsOrigins.find((origin) => origin.includes('localhost') || origin.includes('127.0.0.1') || origin === '*');
    if (unsafeOrigin) {
      throw new Error(`Unsafe CORS origin in production: ${unsafeOrigin}`);
    }
  }

  const hasDatabaseUrl = Boolean(parsed.DATABASE_URL);
  const hasDatabaseParts = Boolean(parsed.DB_HOST && parsed.DB_NAME && parsed.DB_USER && parsed.DB_PASSWORD);
  if (!hasDatabaseUrl && !hasDatabaseParts) {
    throw new Error('Provide DATABASE_URL or DB_HOST, DB_NAME, DB_USER and DB_PASSWORD');
  }

  if (parsed.JWT_ACCESS_SECRET === parsed.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  }

  const bootstrapEnabled = parsed.BOOTSTRAP_SUPER_ADMIN ?? false;
  if (bootstrapEnabled) {
    if (!parsed.SUPER_ADMIN_EMAIL) {
      throw new Error('SUPER_ADMIN_EMAIL is required when BOOTSTRAP_SUPER_ADMIN=true');
    }
    if (!parsed.SUPER_ADMIN_PASSWORD) {
      throw new Error('SUPER_ADMIN_PASSWORD is required when BOOTSTRAP_SUPER_ADMIN=true');
    }
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    corsOrigins,
    tz: parsed.TZ,
    logLevel: parsed.LOG_LEVEL,
    swaggerEnabled: parsed.SWAGGER_ENABLED ?? parsed.NODE_ENV !== 'production',
    trustProxy: parsed.TRUST_PROXY ?? parsed.NODE_ENV === 'production',
    bootstrap: {
      superAdmin: {
        enabled: bootstrapEnabled,
        email: parsed.SUPER_ADMIN_EMAIL || undefined,
        password: parsed.SUPER_ADMIN_PASSWORD || undefined,
        name: parsed.SUPER_ADMIN_NAME || undefined
      }
    },
    database: {
      url: parsed.DATABASE_URL || undefined,
      host: parsed.DB_HOST,
      port: parsed.DB_PORT,
      name: parsed.DB_NAME,
      user: parsed.DB_USER,
      password: parsed.DB_PASSWORD
    },
    jwt: {
      accessSecret: parsed.JWT_ACCESS_SECRET,
      refreshSecret: parsed.JWT_REFRESH_SECRET,
      accessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN
    },
    smtp:
      parsed.SMTP_HOST || parsed.SMTP_USER || parsed.SMTP_PASSWORD || parsed.SMTP_FROM
        ? {
            host: parsed.SMTP_HOST || undefined,
            port: parsed.SMTP_PORT,
            user: parsed.SMTP_USER || undefined,
            password: parsed.SMTP_PASSWORD || undefined,
            from: parsed.SMTP_FROM || undefined
          }
        : undefined
  };
}
