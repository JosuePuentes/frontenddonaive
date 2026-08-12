import { PrismaClient } from "@prisma/client";
import { env, isDatabaseConfigured } from "./env.js";

declare global {
  // eslint-disable-next-line no-var
  var __donaivePrisma: PrismaClient | undefined;
}

let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL no configurada. Configure apps/api/.env antes de conectar a PostgreSQL.",
    );
  }

  if (!client) {
    client =
      globalThis.__donaivePrisma ??
      new PrismaClient({
        log:
          env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });

    if (env.NODE_ENV !== "production") {
      globalThis.__donaivePrisma = client;
    }
  }

  return client;
}

export async function connectDatabase(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  await getPrisma().$connect();
  return true;
}

export async function disconnectDatabase(): Promise<void> {
  if (client) {
    await client.$disconnect();
  }
}

export function isDatabaseConnected(): boolean {
  return isDatabaseConfigured();
}
