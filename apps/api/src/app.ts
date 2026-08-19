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
import { adTvSyncRouter } from "./ad/tv-sync.routes.js";
import { adRouter } from "./ad/routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      /** Assets TV se cargan desde el túnel del frontend (otro origen). */
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "40mb" }));
  /**
   * Subidas TV: el navegador a veces manda video/mp4 (o nada) en vez de
   * application/octet-stream. Si no parseamos raw, el body llega vacío.
   */
  app.use(
    express.raw({
      limit: "80mb",
      type: (req) => {
        const anyReq = req as { originalUrl?: string; url?: string };
        const url = `${anyReq.originalUrl || anyReq.url || ""}`;
        const pathOnly = url.split("?")[0] ?? "";
        const ct = String(req.headers["content-type"] || "").toLowerCase();
        if (
          ct.includes("application/json") ||
          ct.includes("multipart/form-data")
        ) {
          return false;
        }
        if (
          pathOnly.endsWith("/tv/assets/binary") ||
          pathOnly.endsWith("/tv/assets/binary/chunk")
        ) {
          return true;
        }
        return (
          ct.includes("application/octet-stream") || ct.startsWith("video/")
        );
      },
    }),
  );

  app.use(healthRouter);
  /** A&D público: login/bootstrap/logout (JWT). */
  app.use("/api/v1/ad", databaseGuard, adPublicAuthRouter);
  /** A&D TV sync MOCK multi-dispositivo (reproductor sin JWT). */
  app.use("/api/v1/ad", adTvSyncRouter);
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
