import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  JWT_SECRET: z.string().optional(),
  CORE_DB_SCHEMA: z.string().default("donaive_core"),
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
