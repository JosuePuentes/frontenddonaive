import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.routes.js";
import { v1Router } from "./routes/v1.routes.js";
import {
  authMiddleware,
} from "./middleware/auth.middleware.js";
import {
  databaseGuard,
  errorHandler,
} from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use(healthRouter);
  app.use("/api/v1", databaseGuard, authMiddleware, v1Router);

  app.use(errorHandler);

  return app;
}
