import { Router } from "express";
import { env, isDatabaseConfigured } from "../config/env.js";
import { connectDatabase } from "../config/database.js";

export const healthRouter = Router();

/** Liveness — proceso HTTP vivo (Render health check recomendado). */
healthRouter.get("/health/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "donaive-core-api",
    check: "live",
    timestamp: new Date().toISOString(),
  });
});

/** Health general — incluye estado de DB sin fallar si la DB no responde. */
healthRouter.get("/health", async (_req, res) => {
  const dbConfigured = isDatabaseConfigured();
  let dbConnected = false;
  let dbError: string | undefined;

  if (dbConfigured) {
    try {
      dbConnected = await connectDatabase();
    } catch (err) {
      dbConnected = false;
      dbError =
        err instanceof Error ? err.message : "Error de conexión a PostgreSQL";
    }
  }

  res.status(200).json({
    status: "ok",
    service: "donaive-core-api",
    check: "health",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      configured: dbConfigured,
      connected: dbConnected,
      schema: env.CORE_DB_SCHEMA,
      ...(dbError ? { error: dbError } : {}),
    },
  });
});

/** Readiness — requiere DB conectada (opcional para orquestadores). */
healthRouter.get("/health/ready", async (_req, res) => {
  if (!isDatabaseConfigured()) {
    res.status(503).json({
      status: "not_ready",
      reason: "DATABASE_URL not configured",
    });
    return;
  }

  try {
    const connected = await connectDatabase();
    if (!connected) {
      res.status(503).json({ status: "not_ready", reason: "database unreachable" });
      return;
    }
    res.status(200).json({ status: "ready", schema: env.CORE_DB_SCHEMA });
  } catch {
    res.status(503).json({ status: "not_ready", reason: "database unreachable" });
  }
});
