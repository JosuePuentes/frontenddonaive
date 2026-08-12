import type { CorsOptions } from "cors";
import { getCorsOrigins, isProduction } from "./env.js";

/**
 * CORS para Donaive Core API.
 * - Producción: requiere CORS_ORIGIN (ej. https://donaive.com.ve)
 * - Desarrollo: permite todos los orígenes si CORS_ORIGIN no está definido
 */
export function buildCorsOptions(): CorsOptions {
  const origins = getCorsOrigins();

  if (origins && origins.length > 0) {
    return {
      origin: origins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-User-Id",
        "X-User-Email",
        "X-User-Roles",
        "X-Accessible-Project-Ids",
      ],
    };
  }

  if (isProduction()) {
    console.warn(
      "[api] CORS_ORIGIN no configurado en producción — CORS denegará orígenes externos",
    );
    return {
      origin: false,
      credentials: true,
    };
  }

  return {
    origin: true,
    credentials: true,
  };
}
