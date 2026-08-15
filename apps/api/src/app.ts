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

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);
  /** Login/bootstrap A&D sin X-User-Id de Core (JWT pendiente). */
  app.use("/api/v1/ad", databaseGuard, adPublicAuthRouter);
  app.use("/api/v1", databaseGuard, authMiddleware, v1Router);

  app.use(errorHandler);

  return app;
}
