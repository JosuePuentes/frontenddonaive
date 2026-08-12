import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { isDatabaseConfigured, isProduction } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (isProduction()) {
    console.error("[api] unhandled error", err instanceof Error ? err.message : err);
  } else {
    console.error("[api] unhandled error", err);
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Error interno del servidor",
    },
  });
}

export function databaseGuard(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isDatabaseConfigured()) {
    res.status(503).json({
      error: {
        code: "DATABASE_NOT_CONFIGURED",
        message:
          "DATABASE_URL no configurada. Configure la variable de entorno para habilitar persistencia.",
      },
    });
    return;
  }
  next();
}
