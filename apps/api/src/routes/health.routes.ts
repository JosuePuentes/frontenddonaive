import { Router } from "express";
import { isDatabaseConfigured } from "../config/env.js";
import { connectDatabase } from "../config/database.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const dbConfigured = isDatabaseConfigured();
  let dbConnected = false;

  if (dbConfigured) {
    try {
      dbConnected = await connectDatabase();
    } catch {
      dbConnected = false;
    }
  }

  res.json({
    status: "ok",
    service: "donaive-core-api",
    timestamp: new Date().toISOString(),
    database: {
      configured: dbConfigured,
      connected: dbConnected,
      schema: "donaive_core",
    },
  });
});
