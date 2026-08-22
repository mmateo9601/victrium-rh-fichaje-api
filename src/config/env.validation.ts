import { z } from 'zod';

const optionalPositiveNumber = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  CORS_ORIGINS: z
    .string()
    .default('https://victrium-rh-fichaje-web.victriumtech.com,http://localhost:3000'),
  TZ: z.string().default('Europe/Madrid'),
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
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
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

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    corsOrigins,
    tz: parsed.TZ,
    database: {
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
