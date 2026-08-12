import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  JWT_SECRET: z.string().optional(),
  CORE_DB_SCHEMA: z.string().default("donaive_core"),
  /** Orígenes CORS permitidos (comma-separated). Vacío en dev = permitir todos. */
  CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}

export const env = loadEnv();

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? env.DATABASE_URL;
  return Boolean(url && url.length > 0);
}

export function isProduction(): boolean {
  return (process.env.NODE_ENV ?? env.NODE_ENV) === "production";
}

export function getCorsOrigins(): string[] | undefined {
  const raw = process.env.CORS_ORIGIN ?? env.CORS_ORIGIN;
  if (!raw || raw.trim().length === 0) {
    return undefined;
  }
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}
