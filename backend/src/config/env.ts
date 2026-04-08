import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3333),
  DATABASE_URL: required("DATABASE_URL", "postgresql://helpdesk:helpdesk@localhost:5432/helpdesk?schema=public"),
  JWT_SECRET: required("JWT_SECRET", "change-me-in-production"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
} as const;

export type AppEnv = typeof env;
