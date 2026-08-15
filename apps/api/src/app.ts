import express from "express";
import cors from "cors";
import helmet from "helmet";
import { buildCorsOptions } from "./config/cors.js";
import { healthRouter } from "./routes/health.routes.js";
import { v1Router } from "./routes/v1.routes.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import {
  databaseGuard,
  errorHandler,
} from "./middleware/error.middleware.js";
import { adPublicAuthRouter } from "./ad/public-auth.routes.js";
import { adRouter } from "./ad/routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);
  /** A&D público: login/bootstrap/logout (JWT). */
  app.use("/api/v1/ad", databaseGuard, adPublicAuthRouter);
  /**
   * A&D protegido con JWT propio (Fase 4) — sin exigir X-User-Id Core.
   * El router aplica adContextMiddleware internamente.
   */
  app.use("/api/v1/ad", databaseGuard, adRouter);
  /** Rutas Core Donaive (headers de desarrollo / futuro JWT Core). */
  app.use("/api/v1", databaseGuard, authMiddleware, v1Router);

  app.use(errorHandler);

  return app;
}
