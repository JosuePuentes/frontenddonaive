import type { CorsOptions } from "cors";
import { getCorsOrigins, isProduction } from "./env.js";

const CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const CORS_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-User-Id",
  "X-User-Email",
  "X-User-Roles",
  "X-Accessible-Project-Ids",
  "X-Mime-Type",
  "Accept",
];

/** Hosts del proyecto Vercel `ad-licoreria` (no frontenddonaive / polisur). */
export function isAdLicoreriaVercelOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.trim().toLowerCase();
    if (!host.endsWith(".vercel.app")) return false;
    return host === "ad-licoreria.vercel.app" || host.startsWith("ad-licoreria-");
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string, configured: string[]): boolean {
  if (configured.includes(origin)) return true;
  return isAdLicoreriaVercelOrigin(origin);
}

/**
 * CORS para Donaive Core API.
 * - Producción: requiere CORS_ORIGIN (ej. https://donaive.com.ve)
 * - Desarrollo: permite todos los orígenes si CORS_ORIGIN no está definido
 * - Extra: orígenes Vercel del proyecto ad-licoreria (previews con hash)
 */
export function buildCorsOptions(): CorsOptions {
  const origins = getCorsOrigins();

  if (origins && origins.length > 0) {
    return {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        callback(null, isAllowedOrigin(origin, origins));
      },
      credentials: true,
      methods: CORS_METHODS,
      allowedHeaders: CORS_HEADERS,
      maxAge: 86400,
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
    methods: CORS_METHODS,
    allowedHeaders: CORS_HEADERS,
  };
}
